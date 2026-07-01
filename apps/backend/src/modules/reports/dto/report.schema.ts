import { z } from "zod";

/** Body of POST /api/v1/reports. */
export const CreateReportSchema = z
  .object({
    query: z.string().trim().min(3, "query must be at least 3 characters").max(500),
    topic: z.string().trim().max(200).optional(),
    projectId: z.string().optional(),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
    language: z.enum(["auto", "en", "vi"]).default("auto"),
    deepAnalysis: z.boolean().optional(), // Phase D — opt-in Gemini function-calling mode
    fast: z.boolean().optional(), // Fast mode — Flash model (ignored when deepAnalysis is true)
  })
  .refine((b) => b.yearFrom === undefined || b.yearTo === undefined || b.yearFrom <= b.yearTo, {
    message: "yearFrom must be <= yearTo",
  });

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

/** Query params of GET /api/v1/reports. */
export const ListReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  projectId: z.string().optional(),
});

export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;

/** Body of DELETE /api/v1/reports (batch delete) */
export const BatchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, "must provide at least one id to delete"),
});

export type BatchDeleteInput = z.infer<typeof BatchDeleteSchema>;

export const PaperIdParamSchema = z.object({
  paperId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid paper ID format"),
});

export type PaperIdParam = z.infer<typeof PaperIdParamSchema>;
