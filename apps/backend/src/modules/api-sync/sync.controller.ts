import type { Request, Response } from "express";
import { apiSyncQueue } from "../../infrastructure/queue.js";
import { ApiSyncRunModel } from "./models/api-sync-run.model.js";
import type { TriggerSyncInput } from "./dto/trigger-sync.schema.js";

/**
 * Thin HTTP layer. Triggering a sync only ENQUEUES a BullMQ job and returns
 * immediately — the standalone worker (pnpm worker:sync) does the actual work.
 */
export const syncController = {
  async trigger(req: Request<unknown, unknown, TriggerSyncInput>, res: Response) {
    const { searchText, yearFrom, maxPages } = req.body;
    const job = await apiSyncQueue.add("manual-sync", { searchText, yearFrom, maxPages });
    res.status(202).json({
      success: true,
      data: { jobId: job.id, status: "queued", searchText, yearFrom, maxPages },
    });
  },

  async listRuns(_req: Request, res: Response) {
    const runs = await ApiSyncRunModel.find().sort({ startedAt: -1 }).limit(20).lean();
    res.json({ success: true, data: runs, meta: { total: runs.length } });
  },
};
