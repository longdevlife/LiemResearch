import type {
  PublicationTrend,
  RisingKeyword,
  TopItem,
  TrendingTopic,
  TrendsOverview,
  YearlyCount,
} from "@trend/shared-types";
import { AppError } from "../../common/exceptions/app-error.js";
import { cache, hashKey } from "../../infrastructure/cache.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { computeMetrics, fillMissingYears, yoyGrowthPct, truncateToCompleteYears } from "./trend.formulas.js";
import type { TopicTrendQuery, TrendsOverviewQuery } from "./dto/trends.schema.js";

/**
 * Trends — aggregates research_papers into "what's rising, what's fading".
 *
 * Strategy: compute on-demand with MongoDB aggregation (cheap at current
 * collection size — single-digit ms) and memoize in Redis for an hour. Trend
 * data only changes when a sync runs, so a 1h TTL is effectively fresh.
 * Bump CACHE_VERSION whenever shapes/formulas change to invalidate old keys.
 */
const CACHE_VERSION = "trends-v2";
const CACHE_TTL_SECONDS = 3600;

/** Default analysis window: the last 6 calendar years (5 complete + current). */
const DEFAULT_WINDOW_YEARS = 5;

/** A keyword only qualifies as "rising" if its previous complete year had at
 *  least this many papers — otherwise 1→9 papers posts a meaningless +800%
 *  and buries genuinely emerging directions. */
const MIN_RISING_PREV_BASE = 2;

interface GroupedSeries {
  /** topicName / keywordName */
  _id: string;
  total: number;
  years: YearlyCount[];
}

export const trendService = {
  /** GET /trends — top trending topics + rising keywords across the corpus. */
  async overview(query: TrendsOverviewQuery): Promise<TrendsOverview> {
    const now = new Date();
    const yearTo = query.yearTo ?? now.getFullYear();
    const yearFrom = query.yearFrom ?? yearTo - DEFAULT_WINDOW_YEARS;
    const lastCompleteYear = Math.min(yearTo, now.getFullYear() - 1);
    const { limit, minPapers, sortBy } = query;

    const cacheKey = `${CACHE_VERSION}:overview:${hashKey({ yearFrom, yearTo, limit, minPapers, sortBy })}`;
    const cached = await cache.get<TrendsOverview>(cacheKey);
    if (cached) return cached;

    const matchStage = {
      dataStatus: "active",
      publicationYear: { $gte: yearFrom, $lte: yearTo },
    };

    const [topicGroups, keywordGroups, totalPapersInWindow] = await Promise.all([
      groupYearlyCounts("$topics.topicName", "$topics", matchStage, minPapers),
      groupYearlyCounts("$keywords.keywordName", "$keywords", matchStage, 3),
      PaperModel.countDocuments(matchStage),
    ]);

    const topics: TrendingTopic[] = topicGroups.map((g) => {
      const yearlyBreakdown = fillMissingYears(g.years, yearFrom, yearTo);
      return {
        topic: g._id,
        totalPapers: g.total,
        yearlyBreakdown,
        ...computeMetrics(yearlyBreakdown, lastCompleteYear),
      };
    });

    topics.sort((a, b) => {
      if (sortBy === "growth") return b.growthRatePct - a.growthRatePct;
      if (sortBy === "total") return b.totalPapers - a.totalPapers;
      return b.momentum - a.momentum;
    });

    // Rising keyword = strong recent growth from a small base — the early
    // signal of a NEW research direction (exactly what a thesis hunter wants).
    // Gate on the previous-year base so a 1→9 fluke can't post +800% and
    // outrank a genuine 8→40 takeoff.
    const risingKeywords: RisingKeyword[] = keywordGroups
      .map((g) => {
        const yearlyBreakdown = fillMissingYears(g.years, yearFrom, yearTo);
        const complete = truncateToCompleteYears(yearlyBreakdown, lastCompleteYear);
        const prevBase = complete.length >= 2 ? complete[complete.length - 2]!.count : 0;
        return {
          keyword: g._id,
          totalPapers: g.total,
          growthRatePct: yoyGrowthPct(complete),
          yearlyBreakdown,
          prevBase,
        };
      })
      .filter((k) => k.growthRatePct > 0 && k.prevBase >= MIN_RISING_PREV_BASE)
      .sort((a, b) => b.growthRatePct - a.growthRatePct || a.totalPapers - b.totalPapers)
      .slice(0, 10)
      .map(({ prevBase: _internal, ...k }) => k);

    const result: TrendsOverview = {
      yearFrom,
      yearTo,
      lastCompleteYear,
      totalPapersInWindow,
      topics: topics.slice(0, limit),
      risingKeywords,
      computedAt: now.toISOString(),
    };

    await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  },

  /** GET /trends/:topic — yearly series + metrics + top journals/authors/keywords. */
  async topic(topicName: string, query: TopicTrendQuery): Promise<PublicationTrend> {
    const now = new Date();
    const yearTo = query.yearTo ?? now.getFullYear();
    const yearFrom = query.yearFrom ?? yearTo - DEFAULT_WINDOW_YEARS;
    const lastCompleteYear = Math.min(yearTo, now.getFullYear() - 1);

    const cacheKey = `${CACHE_VERSION}:topic:${hashKey({ topicName, yearFrom, yearTo })}`;
    const cached = await cache.get<PublicationTrend>(cacheKey);
    if (cached) return cached;

    const matchStage = {
      dataStatus: "active",
      "topics.topicName": topicName,
      publicationYear: { $gte: yearFrom, $lte: yearTo },
    };

    const [yearGroups, topJournals, topAuthors, topKeywords] = await Promise.all([
      PaperModel.aggregate<{ _id: number; count: number }>([
        { $match: matchStage },
        { $group: { _id: "$publicationYear", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      topByField(matchStage, "$journalName"),
      topByUnwound(matchStage, "$authors", "$authors.displayName"),
      topByUnwound(matchStage, "$keywords", "$keywords.keywordName"),
    ]);

    const totalPapers = yearGroups.reduce((s, g) => s + g.count, 0);
    if (totalPapers === 0) {
      throw AppError.notFound(`No papers found for topic "${topicName}" in ${yearFrom}-${yearTo}`);
    }

    const yearlyBreakdown = fillMissingYears(
      yearGroups.map((g) => ({ year: g._id, count: g.count })),
      yearFrom,
      yearTo,
    );

    const result: PublicationTrend = {
      topic: topicName,
      totalPapers,
      yearlyBreakdown,
      lastCompleteYear,
      ...computeMetrics(yearlyBreakdown, lastCompleteYear),
      topJournals,
      topAuthors,
      topKeywords,
      computedAt: now.toISOString(),
    };

    await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  },
};

/**
 * Shared aggregation: unwind an embedded array, count DISTINCT papers per
 * (name, year), then regroup into one yearly series per name.
 *
 * $addToSet of the paper _id (instead of $sum: 1) makes one paper contribute
 * at most 1 even if its embedded array repeats the same name twice.
 */
async function groupYearlyCounts(
  nameField: string,
  unwindPath: string,
  matchStage: Record<string, unknown>,
  minTotal: number,
): Promise<GroupedSeries[]> {
  return PaperModel.aggregate<GroupedSeries>([
    { $match: matchStage },
    { $unwind: unwindPath },
    {
      $group: {
        _id: { name: nameField, year: "$publicationYear" },
        papers: { $addToSet: "$_id" },
      },
    },
    { $set: { count: { $size: "$papers" } } },
    {
      $group: {
        _id: "$_id.name",
        total: { $sum: "$count" },
        years: { $push: { year: "$_id.year", count: "$count" } },
      },
    },
    { $match: { total: { $gte: minTotal }, _id: { $ne: null } } },
    { $sort: { total: -1 } },
  ]);
}

/** Top-5 count of a scalar field (e.g. journalName) under a match. */
async function topByField(
  matchStage: Record<string, unknown>,
  field: string,
): Promise<TopItem[]> {
  const rows = await PaperModel.aggregate<{ _id: string; count: number }>([
    { $match: matchStage },
    { $match: { [field.slice(1)]: { $nin: [null, ""] } } },
    { $group: { _id: field, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);
  return rows.map((r) => ({ id: r._id, name: r._id, count: r.count }));
}

/** Top-5 DISTINCT-paper count of a name inside an embedded array
 *  (authors, keywords). $addToSet dedupes intra-paper repeats. */
async function topByUnwound(
  matchStage: Record<string, unknown>,
  unwindPath: string,
  nameField: string,
): Promise<TopItem[]> {
  const rows = await PaperModel.aggregate<{ _id: string; count: number }>([
    { $match: matchStage },
    { $unwind: unwindPath },
    { $group: { _id: nameField, papers: { $addToSet: "$_id" } } },
    { $match: { _id: { $ne: null } } },
    { $set: { count: { $size: "$papers" } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { count: 1 } },
  ]);
  return rows.map((r) => ({ id: r._id, name: r._id, count: r.count }));
}
