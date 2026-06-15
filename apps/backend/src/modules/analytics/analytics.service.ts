import { logger } from "../../infrastructure/logger.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { SearchLogModel, type SearchLogDoc } from "./models/search-log.model.js";

export type { SearchLogDoc };

export interface LogSearchParams {
  userId?: string;
  query: string;
  mode: "semantic" | "semantic+rerank";
  resultCount: number;
  durationMs: number;
  filters: { yearFrom?: number; yearTo?: number };
}

export interface TopQuery { query: string; count: number; }
export interface VolumeByDay { date: string; count: number; }
export interface SearchSummary { totalSearches: number; totalPapers: number; uniqueUsers: number; }

export const analyticsService = {
  logSearch(params: LogSearchParams): void {
    SearchLogModel.create({
      userId: params.userId,
      query: params.query,
      mode: params.mode,
      resultCount: params.resultCount,
      durationMs: params.durationMs,
      filters: params.filters,
    }).catch((err) => logger.warn({ err }, "search log write failed (non-fatal)"));
  },

  async getTopQueries(days: number): Promise<TopQuery[]> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const rows = await SearchLogModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$query", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    return rows.map((r) => ({ query: r._id, count: r.count }));
  },

  async getVolumeByDay(days: number): Promise<VolumeByDay[]> {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const rows = await SearchLogModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, count: r.count }));
  },

  async getUserHistory(userId: string): Promise<SearchLogDoc[]> {
    return SearchLogModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  },

  async getSummary(): Promise<SearchSummary> {
    const [totalSearches, totalPapers, distinctUsers] = await Promise.all([
      SearchLogModel.countDocuments(),
      PaperModel.countDocuments({ dataStatus: "active" }),
      SearchLogModel.distinct("userId"),
    ]);
    return {
      totalSearches,
      totalPapers,
      uniqueUsers: distinctUsers.filter(Boolean).length,
    };
  },
};
