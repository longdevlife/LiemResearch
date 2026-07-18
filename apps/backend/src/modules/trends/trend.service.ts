import type {
  PublicationTrend,
  RisingKeyword,
  TopItem,
  TopicComparisonItem,
  TrendExplanationResponse,
  TopicRelationshipResponse,
  TrendCompareResponse,
  TrendingTopic,
  TrendFacets,
  TrendsOverview,
  YearlyCitationMetric,
  YearlyCount,
} from "@trend/shared-types";
import { AppError } from "../../common/exceptions/app-error.js";
import { cache, hashKey } from "../../infrastructure/cache.js";
import { cachedGenerateJSON } from "../llm/llm.run.js";
import { PaperModel } from "../papers/models/paper.model.js";
import {
  buildCitationMetric,
  citationBand,
  fillMissingCitationYears,
  fillMissingYearsFromCounts,
  toFacetBuckets,
} from "./trend.intelligence.js";
import { computeMetrics, fillMissingYears, yoyGrowthPct, truncateToCompleteYears } from "./trend.formulas.js";
import type {
  TopicTrendQuery,
  TrendCompareQuery,
  TrendExplainBody,
  TrendRelationshipQuery,
  TrendsOverviewQuery,
} from "./dto/trends.schema.js";

/**
 * Trends — aggregates research_papers into "what's rising, what's fading".
 *
 * Strategy: compute on-demand with MongoDB aggregation (cheap at current
 * collection size — single-digit ms) and memoize in Redis for an hour. Trend
 * data only changes when a sync runs, so a 1h TTL is effectively fresh.
 * Bump CACHE_VERSION whenever shapes/formulas change to invalidate old keys.
 */
const CACHE_VERSION = "trends-v4";
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

    const [topicGroups, keywordGroups, totalPapersInWindow, yearlyTotalPapers, citationTrend, facets] = await Promise.all([
      groupYearlyCounts("$topics.topicName", "$topics", matchStage, minPapers),
      groupYearlyCounts("$keywords.keywordName", "$keywords", matchStage, 3),
      PaperModel.countDocuments(matchStage),
      getYearlyPaperCounts(matchStage, yearFrom, yearTo),
      getCitationTrend(matchStage, yearFrom, yearTo),
      getTrendFacets(matchStage),
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
      yearlyTotalPapers,
      citationTrend,
      facets,
      topics: topics.slice(0, limit),
      risingKeywords,
      computedAt: now.toISOString(),
    };

    await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  },

  /** GET /trends/compare — compare 2-5 topics on the same yearly/citation axes. */
  async compare(query: TrendCompareQuery): Promise<TrendCompareResponse> {
    const now = new Date();
    const yearTo = query.yearTo ?? now.getFullYear();
    const yearFrom = query.yearFrom ?? yearTo - DEFAULT_WINDOW_YEARS;
    const lastCompleteYear = Math.min(yearTo, now.getFullYear() - 1);
    const topics = [...new Set(query.topics)];

    const cacheKey = `${CACHE_VERSION}:compare:${hashKey({ topics, yearFrom, yearTo })}`;
    const cached = await cache.get<TrendCompareResponse>(cacheKey);
    if (cached) return cached;

    const items = await Promise.all(
      topics.map(async (topic) => {
        const matchStage = {
          dataStatus: "active",
          "topics.topicName": topic,
          publicationYear: { $gte: yearFrom, $lte: yearTo },
        };
        const [yearGroups, citationTrend] = await Promise.all([
          PaperModel.aggregate<{ _id: number; count: number }>([
            { $match: matchStage },
            { $group: { _id: "$publicationYear", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]),
          getCitationTrend(matchStage, yearFrom, yearTo),
        ]);
        const yearlyBreakdown = fillMissingYears(
          yearGroups.map((g) => ({ year: g._id, count: g.count })),
          yearFrom,
          yearTo,
        );
        return {
          topic,
          totalPapers: yearlyBreakdown.reduce((sum, p) => sum + p.count, 0),
          yearlyBreakdown,
          citationTrend,
          ...computeMetrics(yearlyBreakdown, lastCompleteYear),
        } satisfies TopicComparisonItem;
      }),
    );

    const result: TrendCompareResponse = {
      yearFrom,
      yearTo,
      lastCompleteYear,
      topics: items,
      computedAt: now.toISOString(),
    };

    await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  },

  /** GET /trends/relationships — graph-ready topic co-occurrence for one topic. */
  async relationships(query: TrendRelationshipQuery): Promise<TopicRelationshipResponse> {
    const now = new Date();
    const yearTo = query.yearTo ?? now.getFullYear();
    const yearFrom = query.yearFrom ?? yearTo - DEFAULT_WINDOW_YEARS;
    const { topic, limit } = query;

    const cacheKey = `${CACHE_VERSION}:relationships:${hashKey({ topic, yearFrom, yearTo, limit })}`;
    const cached = await cache.get<TopicRelationshipResponse>(cacheKey);
    if (cached) return cached;

    const matchStage = {
      dataStatus: "active",
      "topics.topicName": topic,
      publicationYear: { $gte: yearFrom, $lte: yearTo },
    };

    const [sourceCount, related] = await Promise.all([
      PaperModel.countDocuments(matchStage),
      PaperModel.aggregate<{ _id: string; count: number }>([
        { $match: matchStage },
        { $unwind: "$topics" },
        { $match: { "topics.topicName": { $ne: topic, $nin: [null, ""] } } },
        { $group: { _id: "$topics.topicName", papers: { $addToSet: "$_id" } } },
        { $set: { count: { $size: "$papers" } } },
        { $sort: { count: -1 } },
        { $limit: limit },
        { $project: { count: 1 } },
      ]),
    ]);

    const nodes = [
      { id: topic, label: topic, count: sourceCount },
      ...related.map((r) => ({ id: r._id, label: r._id, count: r.count })),
    ];
    const edges = related.map((r) => ({ source: topic, target: r._id, count: r.count }));
    const result: TopicRelationshipResponse = { topic, yearFrom, yearTo, nodes, edges, computedAt: now.toISOString() };

    await cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  },

  /** POST /trends/explain — AI explanation grounded only in aggregate trend metrics. */
  async explain(input: TrendExplainBody): Promise<TrendExplanationResponse> {
    const now = new Date();
    const yearTo = input.yearTo ?? now.getFullYear();
    const yearFrom = input.yearFrom ?? yearTo - DEFAULT_WINDOW_YEARS;
    const overview = await this.overview({ yearFrom, yearTo, limit: 10, minPapers: 3, sortBy: "momentum" });
    const topicDetail = input.topic ? await this.topic(input.topic, { yearFrom, yearTo }).catch(() => null) : null;
    const relationships = input.topic
      ? await this.relationships({ topic: input.topic, yearFrom, yearTo, limit: 8 }).catch(() => null)
      : null;

    const prompt = buildTrendExplainPrompt({
      topic: input.topic ?? null,
      language: input.language,
      overview,
      topicDetail,
      relationships,
    });

    return cachedGenerateJSON<TrendExplanationResponse>({
      task: "trend",
      promptVersion: "trend-explain-v1",
      keyParts: {
        topic: input.topic ?? null,
        yearFrom,
        yearTo,
        language: input.language,
        overviewComputedAt: overview.computedAt,
        topicComputedAt: topicDetail?.computedAt ?? null,
      },
      prompt,
      options: { temperature: 0.2, maxOutputTokens: 1000 },
      validate: (out) => validateTrendExplanation(out, input.topic ?? null, input.language),
    });
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

async function getYearlyPaperCounts(
  matchStage: Record<string, unknown>,
  yearFrom: number,
  yearTo: number,
): Promise<YearlyCount[]> {
  const rows = await PaperModel.aggregate<{ _id: number; count: number }>([
    { $match: matchStage },
    { $group: { _id: "$publicationYear", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return fillMissingYearsFromCounts(rows.map((r) => ({ year: r._id, count: r.count })), yearFrom, yearTo);
}

async function getCitationTrend(
  matchStage: Record<string, unknown>,
  yearFrom: number,
  yearTo: number,
): Promise<YearlyCitationMetric[]> {
  const rows = await PaperModel.aggregate<{ _id: number; count: number; totalCitations: number }>([
    { $match: matchStage },
    {
      $group: {
        _id: "$publicationYear",
        count: { $sum: 1 },
        totalCitations: { $sum: { $ifNull: ["$citationCount", 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return fillMissingCitationYears(
    rows.map((r) => buildCitationMetric(r._id, r.count, r.totalCitations)),
    yearFrom,
    yearTo,
  );
}

async function getTrendFacets(matchStage: Record<string, unknown>): Promise<TrendFacets> {
  const [
    paperKinds,
    openAccessStatuses,
    providers,
    topSources,
    domains,
    fields,
    subfields,
    topics,
    citationRows,
  ] = await Promise.all([
    facetByField(matchStage, "$paperKind", 10),
    facetByField(matchStage, "$openAccessStatus", 10),
    facetByField(matchStage, "$primaryProvider", 10),
    facetByField(matchStage, "$journalName", 10),
    facetByUnwoundField(matchStage, "$topics", "$topics.domainName", 10),
    facetByUnwoundField(matchStage, "$topics", "$topics.fieldName", 10),
    facetByUnwoundField(matchStage, "$topics", "$topics.subfieldName", 10),
    facetByUnwoundField(matchStage, "$topics", "$topics.topicName", 10),
    PaperModel.aggregate<{ _id: string; count: number }>([
      { $match: matchStage },
      {
        $project: {
          band: {
            $switch: {
              branches: [
                { case: { $gte: [{ $ifNull: ["$citationCount", 0] }, 1000] }, then: "1000+" },
                { case: { $gte: [{ $ifNull: ["$citationCount", 0] }, 500] }, then: "500-999" },
                { case: { $gte: [{ $ifNull: ["$citationCount", 0] }, 100] }, then: "100-499" },
                { case: { $gte: [{ $ifNull: ["$citationCount", 0] }, 50] }, then: "50-99" },
                { case: { $gte: [{ $ifNull: ["$citationCount", 0] }, 10] }, then: "10-49" },
              ],
              default: "0-9",
            },
          },
        },
      },
      { $group: { _id: "$band", count: { $sum: 1 } } },
    ]),
  ]);

  const citationOrder = ["0-9", "10-49", "50-99", "100-499", "500-999", "1000+"];
  const byBand = new Map(citationRows.map((r) => [r._id, r.count]));
  return {
    paperKinds,
    openAccessStatuses,
    providers,
    topSources,
    domains,
    fields,
    subfields,
    topics,
    citationBands: citationOrder
      .map((band) => ({ id: band, name: band, count: byBand.get(band) ?? 0 }))
      .filter((b) => b.count > 0 || citationBand(Number.parseInt(b.id, 10) || 0) === b.id),
  };
}

async function facetByField(
  matchStage: Record<string, unknown>,
  field: string,
  limit: number,
): Promise<TopItem[]> {
  const rows = await PaperModel.aggregate<{ _id: string | null; count: number }>([
    { $match: matchStage },
    { $group: { _id: field, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return toFacetBuckets(rows);
}

async function facetByUnwoundField(
  matchStage: Record<string, unknown>,
  unwindPath: string,
  field: string,
  limit: number,
): Promise<TopItem[]> {
  const rows = await PaperModel.aggregate<{ _id: string | null; count: number }>([
    { $match: matchStage },
    { $unwind: unwindPath },
    { $group: { _id: field, papers: { $addToSet: "$_id" } } },
    { $match: { _id: { $nin: [null, ""] } } },
    { $set: { count: { $size: "$papers" } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { count: 1 } },
  ]);
  return toFacetBuckets(rows);
}

function buildTrendExplainPrompt(args: {
  topic: string | null;
  language: "en" | "vi";
  overview: TrendsOverview;
  topicDetail: PublicationTrend | null;
  relationships: TopicRelationshipResponse | null;
}): string {
  const lang = args.language === "vi" ? "Vietnamese" : "English";
  return [
    `OUTPUT LANGUAGE: ${lang}.`,
    "Explain research trends ONLY from the aggregate metrics provided below.",
    "Do not invent paper titles, citations, institutions, authors, or claims not present in the data.",
    "If a signal is weak or from a small base, say so in cautions.",
    "",
    `Focus topic: ${args.topic ?? "overall corpus"}`,
    `Window: ${args.overview.yearFrom}-${args.overview.yearTo}; last complete year: ${args.overview.lastCompleteYear}`,
    "",
    "Overview JSON:",
    JSON.stringify(
      {
        totalPapersInWindow: args.overview.totalPapersInWindow,
        yearlyTotalPapers: args.overview.yearlyTotalPapers,
        citationTrend: args.overview.citationTrend,
        topTopics: args.overview.topics.slice(0, 8),
        risingKeywords: args.overview.risingKeywords.slice(0, 8),
        facets: args.overview.facets,
      },
      null,
      2,
    ),
    "",
    "Topic detail JSON:",
    JSON.stringify(args.topicDetail, null, 2),
    "",
    "Relationship graph JSON:",
    JSON.stringify(args.relationships, null, 2),
    "",
    "Return JSON with exactly this shape:",
    JSON.stringify(
      {
        topic: args.topic,
        language: args.language,
        summary: "one concise paragraph",
        whyItMatters: ["2-4 bullets"],
        evidenceSignals: ["2-5 bullets grounded in counts, growth, momentum, citations, facets, or relationships"],
        cautions: ["1-3 bullets about incomplete year, small base, missing data, or limits"],
        suggestedActions: ["2-4 user actions such as search papers, compare topics, generate report, inspect gaps"],
        generatedAt: "ISO timestamp",
      },
      null,
      2,
    ),
  ].join("\n");
}

function validateTrendExplanation(
  out: TrendExplanationResponse,
  topic: string | null,
  language: "en" | "vi",
): TrendExplanationResponse {
  const arrays = [out.whyItMatters, out.evidenceSignals, out.cautions, out.suggestedActions];
  if (
    typeof out.summary !== "string" ||
    out.summary.trim().length === 0 ||
    arrays.some((a) => !Array.isArray(a))
  ) {
    throw new Error("Invalid trend explanation shape");
  }
  return {
    topic,
    language,
    summary: out.summary.trim(),
    whyItMatters: out.whyItMatters.map(String).filter(Boolean).slice(0, 4),
    evidenceSignals: out.evidenceSignals.map(String).filter(Boolean).slice(0, 5),
    cautions: out.cautions.map(String).filter(Boolean).slice(0, 3),
    suggestedActions: out.suggestedActions.map(String).filter(Boolean).slice(0, 4),
    generatedAt: new Date().toISOString(),
  };
}
