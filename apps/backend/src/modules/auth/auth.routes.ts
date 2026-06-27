import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import { LoginSchema, RefreshSchema, RegisterSchema, UpdateProfileSchema, ChangePasswordSchema } from "./dto/auth.schema.js";
import { UserModel } from "./models/user.model.js";

export const authRouter: Router = Router();

authRouter.post("/register", validate(RegisterSchema), authController.register);
authRouter.post("/login", validate(LoginSchema), authController.login);
authRouter.post("/refresh", validate(RefreshSchema), authController.refresh);
authRouter.post("/logout", validate(RefreshSchema), authController.logout);
authRouter.get("/me", requireAuth, authController.me);
authRouter.patch("/me", requireAuth, validate(UpdateProfileSchema), authController.updateProfile);
authRouter.post("/change-password", requireAuth, validate(ChangePasswordSchema), authController.changePassword);

/** GET /auth/rankings?limit=20 — Public leaderboard by points */
authRouter.get("/rankings", async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const users = await UserModel.find({ isActive: { $ne: false } })
    .select("fullName institution points credits role avatarUrl")
    .sort({ points: -1, credits: -1 })
    .limit(limit)
    .lean();

  const data = users.map((u, i) => ({
    rank: i + 1,
    id: u._id.toString(),
    name: u.fullName,
    university: u.institution ?? "",
    role: u.role,
    points: u.points ?? 0,
    credits: u.credits ?? 0,
    avatarUrl: u.avatarUrl ?? null,
  }));

  res.json({ success: true, data });
});

