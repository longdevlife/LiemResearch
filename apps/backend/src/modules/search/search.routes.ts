import { Router } from "express";
import { searchController } from "./search.controller.js";

export const searchRouter: Router = Router();

searchRouter.get("/", searchController.semantic);
