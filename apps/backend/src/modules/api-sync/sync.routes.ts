import { Router, type RequestHandler } from "express";
import { env } from "../../config/env.js";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { logger } from "../../infrastructure/logger.js";
import { syncController } from "./sync.controller.js";
import { TriggerSyncSchema } from "./dto/trigger-sync.schema.js";

/**
 * Admin sync routes. Gated by requireAuth + requireRole("admin").
 * SYNC_ADMIN_BYPASS=true (dev only) drops the gate so the team can demo before
 * an admin user is seeded.
 */
const adminGuard: RequestHandler[] = env.SYNC_ADMIN_BYPASS
  ? []
  : [requireAuth, requireRole("admin")];

if (env.SYNC_ADMIN_BYPASS) {
  logger.warn("SYNC_ADMIN_BYPASS=true — /api/v1/admin/sync is UNPROTECTED (dev only)");
}

export const syncRouter: Router = Router();

syncRouter.post("/sync", ...adminGuard, validate(TriggerSyncSchema), syncController.trigger);
syncRouter.get("/sync/runs", ...adminGuard, syncController.listRuns);
