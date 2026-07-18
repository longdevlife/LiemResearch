import type { Request, Response, NextFunction } from "express";
import { creditService } from "./credit.service.js";
import { ListTransactionsQuerySchema } from "./dto/credit.schema.js";

/**
 * Credit endpoints. All routes sit behind requireAuth, so req.user is set.
 */
export const creditController = {
  /** GET /api/v1/credits/balance */
  async getBalance(req: Request, res: Response) {
    const credits = await creditService.getBalance(req.user!.sub);
    res.json({ success: true, data: { credits } });
  },

  /** GET /api/v1/credits/transactions */
  async listTransactions(req: Request, res: Response, next: NextFunction) {
    const parsed = ListTransactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const { page, pageSize, type, action } = parsed.data;
    const { data, meta } = await creditService.listTransactions({
      userId: req.user!.sub,
      page,
      pageSize,
      type,
      action,
    });

    res.json({ success: true, data, meta });
  },
};
