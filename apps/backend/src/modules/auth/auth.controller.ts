import type { Request, Response } from "express";
import type { LoginInput, RefreshInput, RegisterInput } from "./dto/auth.schema.js";
import { authService } from "./auth.service.js";

export const authController = {
  async register(req: Request<unknown, unknown, RegisterInput>, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request<unknown, unknown, LoginInput>, res: Response) {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  },

  async refresh(req: Request<unknown, unknown, RefreshInput>, res: Response) {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: tokens });
  },

  async logout(req: Request<unknown, unknown, RefreshInput>, res: Response) {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, data: { ok: true } });
  },

  async me(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    const user = await authService.me(req.user.sub);
    res.json({ success: true, data: { user } });
  },
};
