import { z } from "zod";

/** Body of POST /api/v1/reports. */
export const CreateReportSchema = z
  .object({
    query: z.string().trim().min(3, "query must be at least 3 characters").max(500),
    topic: z.string().trim().max(200).optional(),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
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
});

export type ListReportsQuery = z.infer<typeof ListReportsQuerySchema>;
