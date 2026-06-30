import { z } from "zod";

/** Body of POST /api/v1/gaps/analyze. */
export const AnalyzeGapSchema = z.object({
  topic: z.string().min(2).max(200),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
});

/** Query params of GET /api/v1/gaps. */
export const ListGapsQuerySchema = z.object({
  topic: z.string().optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  source: z.enum(["report", "standalone"]).optional(),
  status: z.enum(["active", "resolved", "dismissed"]).default("active"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

/** Body of PATCH /api/v1/gaps/:id. */
export const PatchGapSchema = z.object({
  status: z.enum(["active", "resolved", "dismissed"]),
});

export type AnalyzeGapDto = z.infer<typeof AnalyzeGapSchema>;
export type ListGapsQuery = z.infer<typeof ListGapsQuerySchema>;
export type PatchGapDto = z.infer<typeof PatchGapSchema>;

/** Params of the directions routes: /api/v1/gaps/:id/directions. */
export const GapIdParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "invalid id"),
});

/** Body of POST /api/v1/gaps/:id/directions. */
export const DirectionsBodySchema = z.object({
  force: z.boolean().optional(),
});
export type DirectionsBody = z.infer<typeof DirectionsBodySchema>;
