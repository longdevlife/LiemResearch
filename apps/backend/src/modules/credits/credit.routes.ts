import { Router } from "express";
import { requireAuth } from "../../common/middleware/auth.js";
import { creditController } from "./credit.controller.js";

export const creditRouter: Router = Router();

creditRouter.use(requireAuth);

creditRouter.get("/balance", creditController.getBalance);
creditRouter.get("/transactions", creditController.listTransactions);
