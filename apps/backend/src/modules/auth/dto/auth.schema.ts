import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(120),
  role: z.enum(["student", "lecturer", "researcher"]).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;
