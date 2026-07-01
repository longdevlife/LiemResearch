import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const ProjectChatParamsSchema = z.object({
  id: objectId,
});

export const SendProjectChatMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const ListProjectChatQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
