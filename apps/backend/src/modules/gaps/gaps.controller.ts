import type { NextFunction, Request, Response } from "express";
import { gapsService } from "./gaps.service.js";
import { gapsQueue } from "../../infrastructure/queue.js";
import { AnalyzeGapSchema, ListGapsQuerySchema, PatchGapSchema } from "./dto/gaps.schema.js";

/**
 * Research gaps endpoints. All routes sit behind requireAuth, so req.user is
 * set. Query/body are parsed inline (Express 5 makes req.query a read-only
 * getter), matching the reports module pattern.
 */
export const gapsController = {
  /** POST /api/v1/gaps/analyze — 202 Accepted, work happens in the gaps worker. */
  async analyze(req: Request, res: Response, next: NextFunction) {
    const parsed = AnalyzeGapSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    const analysisId = await gapsService.enqueue(req.user!.sub, parsed.data);
    await gapsQueue.add("gap-analysis", { analysisId });
    res.status(202).json({ success: true, data: { analysisId } });
  },

  /** GET /api/v1/gaps/analyze/:id — poll the analysis status, owner only. */
  async getAnalysis(req: Request, res: Response) {
    const data = await gapsService.getAnalysis(req.user!.sub, req.params.id as string);
    res.json({ success: true, data });
  },

  /** GET /api/v1/gaps — paginated, filterable list of gaps. */
  async list(req: Request, res: Response, next: NextFunction) {
    const parsed = ListGapsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    const { gaps, total } = await gapsService.list(parsed.data);
    const { page, pageSize } = parsed.data;
    res.json({
      success: true,
      data: gaps,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  },

  /** PATCH /api/v1/gaps/:id — resolve / dismiss a gap, owner only. */
  async patch(req: Request, res: Response, next: NextFunction) {
    const parsed = PatchGapSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    const data = await gapsService.patchStatus(req.user!.sub, req.params.id as string, parsed.data);
    res.json({ success: true, data });
  },
};
