import { Router } from "express";
import { trendController } from "./trend.controller.js";

export const trendRouter: Router = Router();

trendRouter.get("/", trendController.overview);
trendRouter.get("/:topic", trendController.topic);
