import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { notificationService } from "./notification.service.js";

export const notificationRouter: Router = Router();

notificationRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = String(req.user!.sub);
    const role = String(req.user!.role);
    const notifications = await notificationService.list(userId, role);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const userId = String(req.user!.sub);
    await notificationService.markAsRead(String(req.params.id), userId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

notificationRouter.post("/read-all", requireAuth, async (req, res, next) => {
  try {
    const userId = String(req.user!.sub);
    const role = String(req.user!.role);
    await notificationService.markAllAsRead(userId, role);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
