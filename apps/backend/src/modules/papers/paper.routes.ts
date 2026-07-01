import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import { AppError } from "../../common/exceptions/app-error.js";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { uploadSinglePdf, assertPdfMagic } from "../../common/middleware/upload.js";
import { CreatePaperSchema } from "./dto/create-paper.schema.js";
import { paperService } from "./paper.service.js";
import { comparePapers } from "./paper.compare.js";
import { PaperListQuerySchema } from "./dto/paper.schema.js";
import { CompareBodySchema } from "./dto/compare.schema.js";
import { embeddingQueue } from "../../infrastructure/queue.js";
import { env } from "../../config/env.js";

import { UserModel } from "../auth/models/user.model.js";
import type { AuthClaims } from "../../common/middleware/auth.js";

export const paperRouter: Router = Router();

const parseOptionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      const claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthClaims;
      const user = await UserModel.findById(claims.sub).select("isActive role").lean();
      if (user && user.isActive !== false) {
        req.user = { ...claims, role: user.role };
      }
    } catch {
      // Ignore token verification failures for optional auth
    }
  }
  next();
};

/**
 * GET /papers — keyword search + server-side filters + sort + pagination (with adminView support).
 */
paperRouter.get("/", parseOptionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req.user?.role as string) === "admin";
    // Admin hitting / with status filter → admin list
    if (isAdmin && req.query.adminView) {
      const status = (req.query.status as string | undefined)?.trim();
      const search = (req.query.search as string | undefined)?.trim();
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
      const { papers, total } = await paperService.getAllPapersAdmin({ status, search, page, pageSize });
      res.json({
        success: true,
        data: papers,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
      return;
    }

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
  } catch (error) {
    next(error);
  }
});

/** GET /papers/my-requests — get current user's paper requests. */
paperRouter.get("/my-requests", requireAuth, async (req, res, next) => {
  try {
    if ((req.user!.role as string) === "admin") {
      throw AppError.forbidden("Admins do not have access to My Papers");
    }
    const papers = await paperService.getMyPapers(req.user!.sub);
    res.json({ success: true, data: papers });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /papers/compare — side-by-side comparison of 2-4 papers.
 * Declared BEFORE the `/:id` routes so "compare" is never captured as an :id.
 */
paperRouter.post("/compare", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = CompareBodySchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }
  const data = await comparePapers(parsed.data.paperIds);
  res.json({ success: true, data });
});

/** GET /papers/:id/references — references resolved to in-corpus papers. */
paperRouter.get("/:id/references", async (req, res) => {
  const data = await paperService.getReferences(req.params.id);
  res.json({ success: true, data });
});

/** GET /papers/:id — single paper detail. */
paperRouter.get("/:id", async (req, res, next) => {
  try {
    const paper = await paperService.getById(req.params.id);
    if (!paper) throw AppError.notFound("Paper not found");
    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

// ── Authenticated Routes ─────────────────────────────────────────────────────

/** POST /papers — create a new paper request (charges 100 credits for regular users). */
paperRouter.post("/", requireAuth, uploadSinglePdf, async (req, res, next) => {
  try {
    if ((req.user!.role as string) === "admin") {
      throw AppError.forbidden("Admins are not allowed to submit papers");
    }

    // 1. Parse stringified JSON arrays from multipart/form-data
    try {
      if (typeof req.body.authors === "string") req.body.authors = JSON.parse(req.body.authors);
      if (typeof req.body.keywords === "string") req.body.keywords = JSON.parse(req.body.keywords);
      if (typeof req.body.topics === "string") req.body.topics = JSON.parse(req.body.topics);
    } catch {
      throw AppError.badRequest("Invalid JSON format for authors, keywords, or topics");
    }

    // 2. Validate
    const parsed = CreatePaperSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "));
    }

    // 3. Save PDF file
    let pdfPath: string | undefined;
    const reqFile = (req as any).file;
    if (reqFile) {
      assertPdfMagic(reqFile.buffer);
      const uploadsDir = path.resolve("uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${path.basename(reqFile.originalname)}`;
      await fs.writeFile(path.join(uploadsDir, safeName), reqFile.buffer);
      pdfPath = `/uploads/${safeName}`;
    }

    // 4. Create paper request
    const userId = req.user!.sub;
    const isAdmin = (req.user!.role as string) === "admin";
    const paper = await paperService.create(userId, isAdmin, parsed.data, pdfPath);

    // 5. Trigger embedding worker
    try {
      await embeddingQueue.add("manual-embedding", {});
    } catch {
      // Non-fatal — embedding can be retried
    }

    res.status(201).json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

/** GET /papers/my-requests — must be before /:id to avoid param capture */

/** GET /papers/:id/pdf-url — get a download URL for the PDF (charges credits). */
paperRouter.get("/:id/pdf-url", requireAuth, async (req, res, next) => {
  try {
    const host = req.get("host");
    const baseUrl = `${req.protocol}://${host}`;
    const result = await paperService.getPdfDownloadUrl(
      String(req.params.id),
      String(req.user!.sub),
      String(req.user!.role),
      baseUrl,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/** GET /papers/:id/download — download the PDF using a short-lived query token. */
paperRouter.get("/:id/download", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      throw AppError.unauthorized("Download token is required");
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      throw AppError.unauthorized("Download token is invalid or expired");
    }

    if (decoded.paperId !== id) {
      throw AppError.forbidden("Token is not valid for this paper");
    }

    const paper = await paperService.getById(id);
    if (!paper || !paper.pdfPath) {
      throw AppError.notFound("PDF is not available for this paper");
    }

    const filePath = path.resolve(paper.pdfPath.replace(/^\//, ""));
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

/** POST /papers/:id/upload-pdf — upload a PDF for an existing paper request. */
paperRouter.post("/:id/upload-pdf", requireAuth, uploadSinglePdf, async (req, res, next) => {
  try {
    const reqFile = (req as any).file;
    if (!reqFile) throw AppError.badRequest("PDF file is required");
    assertPdfMagic(reqFile.buffer);

    const uploadsDir = path.resolve("uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}-${path.basename(reqFile.originalname)}`;
    await fs.writeFile(path.join(uploadsDir, safeName), reqFile.buffer);
    const pdfPath = `/uploads/${safeName}`;

    const paper = await paperService.uploadPdf(
      String(req.params.id),
      String(req.user!.sub),
      String(req.user!.role),
      pdfPath,
    );

    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

/** PATCH /papers/:id/accept-pdf — requester accepts the PDF. */
paperRouter.patch("/:id/accept-pdf", requireAuth, async (req, res, next) => {
  try {
    const paper = await paperService.acceptPdf(String(req.params.id), String(req.user!.sub));
    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

/** PATCH /papers/:id/reject-pdf — requester rejects the uploaded PDF. */
paperRouter.patch("/:id/reject-pdf", requireAuth, async (req, res, next) => {
  try {
    const paper = await paperService.rejectPdf(String(req.params.id), String(req.user!.sub));
    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

/** DELETE /papers/:id/cancel — requester cancels their pending request (refunds credits). */
paperRouter.delete("/:id/cancel", requireAuth, async (req, res, next) => {
  try {
    await paperService.cancelRequest(String(req.params.id), String(req.user!.sub));
    res.json({ success: true, message: "Paper request cancelled successfully" });
  } catch (error) {
    next(error);
  }
});

/** PATCH /papers/:id/status — admin updates paper status. */
paperRouter.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body as { status: string; rejectionReason?: string };
    if (!status) throw AppError.badRequest("Status is required");
    const paper = await paperService.updateStatus(String(req.params.id), status, rejectionReason);
    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

import mongoose from "mongoose";

// ... (keep other imports and code) ...

/** PATCH /papers/:id — admin updates paper details, or user resubmits their rejected paper request. */
paperRouter.patch("/:id", requireAuth, uploadSinglePdf, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const userId = String(req.user!.sub);
    const userRole = String(req.user!.role);
    const isAdmin = userRole === "admin";

    // 1. Parse JSON arrays
    try {
      if (typeof req.body.authors === "string") req.body.authors = JSON.parse(req.body.authors);
      if (typeof req.body.keywords === "string") req.body.keywords = JSON.parse(req.body.keywords);
      if (typeof req.body.topics === "string") req.body.topics = JSON.parse(req.body.topics);
    } catch {
      throw AppError.badRequest("Invalid JSON format for authors, keywords, or topics");
    }

    // 2. Save new PDF file if uploaded
    let pdfPath: string | undefined;
    const reqFile = (req as any).file;
    if (reqFile) {
      assertPdfMagic(reqFile.buffer);
      const uploadsDir = path.resolve("uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${path.basename(reqFile.originalname)}`;
      await fs.writeFile(path.join(uploadsDir, safeName), reqFile.buffer);
      pdfPath = `/uploads/${safeName}`;
    }

    let updated: any;
    if (isAdmin) {
      const updateInput = { ...req.body };
      if (pdfPath) {
        updateInput.pdfPath = pdfPath;
        updateInput.uploadedBy = new mongoose.Types.ObjectId(userId);
        updateInput.uploadedAt = new Date();
      }
      updated = await paperService.update(id, updateInput);
    } else {
      updated = await paperService.resubmit(id, userId, req.body, pdfPath);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/** DELETE /papers/:id/pdf — admin deletes paper PDF. */
paperRouter.delete("/:id/pdf", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const paper = await paperService.deletePaperPdf(String(req.params.id));
    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
});

/** DELETE /papers/:id — requester or admin deletes paper request. */
paperRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await paperService.deletePaper(String(req.params.id), String(req.user!.sub), String(req.user!.role));
    res.json({ success: true, message: "Paper request deleted successfully" });
  } catch (error) {
    next(error);
  }
});
