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

export const TrendCompareQuerySchema = TopicTrendQuerySchema.and(
  z.object({
    topics: z
      .string()
      .transform((s) =>
        s
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.string().min(1)).min(2).max(5)),
  }),
);

export type TrendCompareQuery = z.infer<typeof TrendCompareQuerySchema>;

export const TrendRelationshipQuerySchema = TopicTrendQuerySchema.and(
  z.object({
    topic: z.string().trim().min(1),
    limit: z.coerce.number().int().min(1).max(30).default(12),
  }),
);

export type TrendRelationshipQuery = z.infer<typeof TrendRelationshipQuerySchema>;

export const TrendExplainBodySchema = z
  .object({
    topic: z.string().trim().min(1).max(200).optional(),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
    language: z.enum(["en", "vi"]).default("en"),
  })
  .refine((q) => q.yearFrom === undefined || q.yearTo === undefined || q.yearFrom <= q.yearTo, {
    message: "yearFrom must be <= yearTo",
  });

export type TrendExplainBody = z.infer<typeof TrendExplainBodySchema>;
