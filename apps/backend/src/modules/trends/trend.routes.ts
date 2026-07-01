import { Router } from "express";
import { trendController } from "./trend.controller.js";

export const trendRouter: Router = Router();

trendRouter.get("/", trendController.overview);
trendRouter.get("/compare", trendController.compare);
trendRouter.get("/relationships", trendController.relationships);
trendRouter.post("/explain", trendController.explain);
trendRouter.get("/:topic", trendController.topic);
