import type { NextFunction, Request, Response } from "express";
import { searchService } from "./search.service.js";
import { SearchQuerySchema } from "./dto/search.schema.js";

/**
 * GET /api/v1/search?q=&page=&pageSize=&yearFrom=&yearTo=
 *
 * Query is parsed inline (not via the validate() middleware) because Express 5
 * makes `req.query` a read-only getter — reassigning it throws.
 */
export const searchController = {
  async semantic(req: Request, res: Response, next: NextFunction) {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const { q, page, pageSize, yearFrom, yearTo, rerank } = parsed.data;
    const { papers, total, reranked } = await searchService.semantic({
      q,
      page,
      pageSize,
      yearFrom,
      yearTo,
      rerank,
    });

    res.json({
      success: true,
      data: papers,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        mode: reranked ? "semantic+rerank" : "semantic",
      },
    });
  },
};
