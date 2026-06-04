import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { authController } from "./auth.controller.js";
import { LoginSchema, RefreshSchema, RegisterSchema } from "./dto/auth.schema.js";

export const authRouter: Router = Router();

authRouter.post("/register", validate(RegisterSchema), authController.register);
authRouter.post("/login", validate(LoginSchema), authController.login);
authRouter.post("/refresh", validate(RefreshSchema), authController.refresh);
authRouter.post("/logout", validate(RefreshSchema), authController.logout);
authRouter.get("/me", requireAuth, authController.me);
