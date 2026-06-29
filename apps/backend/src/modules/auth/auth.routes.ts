import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import { LoginSchema, RefreshSchema, RegisterSchema, UpdateProfileSchema, ChangePasswordSchema, RankingsQuerySchema, type RankingsQueryInput } from "./dto/auth.schema.js";
import { UserModel } from "./models/user.model.js";
import { calculateUserRankingStats } from "./points.service.js";
import passport from "./passport.js";

export const authRouter: Router = Router();

authRouter.post("/register", validate(RegisterSchema), authController.register);
authRouter.post("/login", validate(LoginSchema), authController.login);
authRouter.post("/refresh", validate(RefreshSchema), authController.refresh);
authRouter.post("/logout", validate(RefreshSchema), authController.logout);
authRouter.get("/me", requireAuth, authController.me);
authRouter.patch("/me", requireAuth, validate(UpdateProfileSchema), authController.updateProfile);
authRouter.post("/change-password", requireAuth, validate(ChangePasswordSchema), authController.changePassword);

authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=GoogleLoginFailed" }),
  authController.googleCallback
);

/**
 * GET /auth/rankings/top?page=1&limit=20 — Paginated public leaderboard by points.
 * Returns { rankings, pagination } matching the legacy ranking.controller shape.
 */
authRouter.get("/rankings/top", validate(RankingsQuerySchema, "query"), async (req: Request, res: Response) => {
  const { page, limit } = req.query as unknown as RankingsQueryInput;

  const total = await UserModel.countDocuments({ isActive: { $ne: false } });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * limit;

  const users = await UserModel.find({ isActive: { $ne: false } })
    .select("fullName institution points credits role avatarUrl")
    .sort({ points: -1, credits: -1, fullName: 1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const rankings = users.map((u, i) => ({
    rank: skip + i + 1,
    id: u._id.toString(),
    name: u.fullName,
    university: u.institution ?? "",
    role: u.role,
    points: u.points ?? 0,
    credits: u.credits ?? 0,
    avatarUrl: u.avatarUrl ?? null,
  }));

  res.json({
    success: true,
    rankings,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
    },
  });
});

/**
 * GET /auth/rankings/me — Get current user's rank and detailed stats.
 * Returns { rank, stats } for the "Your Position" sidebar.
 */
authRouter.get("/rankings/me", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub?.toString();
  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  // Get how many users have MORE points (to determine rank)
  const userDoc = await UserModel.findById(userId).select("points fullName institution role avatarUrl").lean();
  if (!userDoc) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  const usersAhead = await UserModel.countDocuments({
    isActive: { $ne: false },
    $or: [
      { points: { $gt: userDoc.points ?? 0 } },
      {
        points: userDoc.points ?? 0,
        fullName: { $lt: userDoc.fullName },
      },
    ],
  });

  const rank = usersAhead + 1;
  const stats = await calculateUserRankingStats(userId);

  res.json({
    success: true,
    rank,
    user: {
      id: userId,
      name: userDoc.fullName,
      university: userDoc.institution ?? "",
      role: userDoc.role,
      avatarUrl: userDoc.avatarUrl ?? null,
    },
    stats,
  });
});

/**
 * GET /auth/rankings?limit=20 — Legacy simple endpoint (kept for backwards compat).
 * @deprecated Use /auth/rankings/top instead.
 */
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
