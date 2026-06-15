import type { Request, Response } from "express";
import { gapsService } from "./gaps.service.js";
import type { AnalyzeGapDto, ListGapsQuery, PatchGapDto } from "./dto/gaps.schema.js";

/**
 * Research gaps endpoints. All routes sit behind requireAuth, so req.user is
 * set. Validation is handled by validate() middleware in gaps.routes.ts — req.body
 * and req.query are already parsed and typed when these handlers run.
 */
export const gapsController = {
  /** POST /api/v1/gaps/analyze — 202 Accepted, work happens in the gaps worker. */
  async analyze(req: Request<unknown, unknown, AnalyzeGapDto>, res: Response) {
    const analysisId = await gapsService.enqueue(req.user!.sub, req.body);
    res.status(202).json({ success: true, data: { analysisId } });
  },

  /** GET /api/v1/gaps/analyze/:id — poll the analysis status, owner only. */
  async getAnalysis(req: Request, res: Response) {
    const data = await gapsService.getAnalysis(req.user!.sub, req.params["id"] as string);
    res.json({ success: true, data });
  },

  /** GET /api/v1/gaps — paginated, filterable list of gaps. */
  async list(req: Request, res: Response) {
    const query = req.query as unknown as ListGapsQuery;
    const { gaps, total } = await gapsService.list(query);
    const { page, pageSize } = query;
    res.json({
      success: true,
      data: gaps,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  },

  /** PATCH /api/v1/gaps/:id — resolve / dismiss a gap, owner only. */
  async patch(req: Request, res: Response) {
    const data = await gapsService.patchStatus(req.user!.sub, req.params["id"] as string, req.body as PatchGapDto);
    res.json({ success: true, data });
  },
};
