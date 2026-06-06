import { z } from "zod";

/** Query params for GET /api/v1/trends (overview). */
export const TrendsOverviewQuerySchema = z
  .object({
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    /** Topics with fewer total papers than this are noise — hide them. */
    minPapers: z.coerce.number().int().min(1).max(1000).default(3),
    sortBy: z.enum(["momentum", "growth", "total"]).default("momentum"),
  })
  .refine((q) => q.yearFrom === undefined || q.yearTo === undefined || q.yearFrom <= q.yearTo, {
    message: "yearFrom must be <= yearTo",
  });

export type TrendsOverviewQuery = z.infer<typeof TrendsOverviewQuerySchema>;

/** Query params for GET /api/v1/trends/:topic (topic deep dive). */
export const TopicTrendQuerySchema = z
  .object({
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  })
  .refine((q) => q.yearFrom === undefined || q.yearTo === undefined || q.yearFrom <= q.yearTo, {
    message: "yearFrom must be <= yearTo",
  });

export type TopicTrendQuery = z.infer<typeof TopicTrendQuerySchema>;
