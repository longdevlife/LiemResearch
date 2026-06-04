import { z } from "zod";

/** Body for POST /api/v1/admin/sync. */
export const TriggerSyncSchema = z.object({
  searchText: z.string().min(1, "searchText is required"),
  yearFrom: z.coerce.number().int().min(1900).max(2100).default(2022),
  maxPages: z.coerce.number().int().min(1).max(50).default(1),
});

export type TriggerSyncInput = z.infer<typeof TriggerSyncSchema>;
