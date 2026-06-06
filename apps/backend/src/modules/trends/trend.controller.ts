import type { NextFunction, Request, Response } from "express";
import { trendService } from "./trend.service.js";
import { TopicTrendQuerySchema, TrendsOverviewQuerySchema } from "./dto/trends.schema.js";

/**
 * Trends endpoints. Query is parsed inline (not via the validate() middleware)
 * because Express 5 makes `req.query` a read-only getter — reassigning throws.
 */
export const trendController = {
  /** GET /api/v1/trends?yearFrom=&yearTo=&limit=&minPapers=&sortBy= */
  async overview(req: Request, res: Response, next: NextFunction) {
    const parsed = TrendsOverviewQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const data = await trendService.overview(parsed.data);
    res.json({ success: true, data });
  },

  /** GET /api/v1/trends/:topic?yearFrom=&yearTo=   (:topic is URL-encoded) */
  async topic(req: Request, res: Response, next: NextFunction) {
    const parsed = TopicTrendQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const data = await trendService.topic(req.params.topic as string, parsed.data);
    res.json({ success: true, data });
  },
};
