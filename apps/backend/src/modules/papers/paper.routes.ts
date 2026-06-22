import { Router, type NextFunction, type Request, type Response } from "express";
import { AppError } from "../../common/exceptions/app-error.js";
import { paperService } from "./paper.service.js";
import { PaperListQuerySchema } from "./dto/paper.schema.js";

export const paperRouter: Router = Router();

/**
 * GET /papers — keyword search + server-side filters + sort + pagination.
 * Query is parsed inline (not via validate() middleware) because Express 5
 * makes `req.query` a read-only getter — reassigning it throws.
 */
paperRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = PaperListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }

  const { q, page, pageSize, yearFrom, yearTo, paperKind, openAccess, provider, sort } = parsed.data;
  const { papers, total } = await paperService.list({
    q,
    page,
    pageSize,
    yearFrom,
    yearTo,
    paperKinds: paperKind,
    openAccess,
    provider,
    sort,
  });

  res.json({
    success: true,
    data: papers,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

/** GET /papers/:id — single paper detail. */
paperRouter.get("/:id", async (req, res) => {
  const paper = await paperService.getById(req.params.id);
  if (!paper) throw AppError.notFound("Paper not found");
  res.json({ success: true, data: paper });
});
