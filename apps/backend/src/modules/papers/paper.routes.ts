import { Router } from "express";
import { AppError } from "../../common/exceptions/app-error.js";
import { paperService } from "./paper.service.js";

export const paperRouter: Router = Router();

/** GET /papers?q=&page=&pageSize= — keyword search + pagination. */
paperRouter.get("/", async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

  const { papers, total } = await paperService.list({ q, page, pageSize });

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
