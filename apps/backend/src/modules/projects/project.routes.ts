import { Router } from "express";
import { projectController } from "./project.controller.js";
import { requireAuth } from "../../common/middleware/auth.js";

export const projectRouter: Router = Router();

projectRouter.use(requireAuth);

projectRouter.post("/", projectController.createProject);
projectRouter.get("/", projectController.getProjectsByUser);
projectRouter.get("/:id", projectController.getProjectById);
projectRouter.put("/:id", projectController.updateProject);
projectRouter.delete("/:id", projectController.deleteProject);

projectRouter.post("/:id/papers", projectController.addPaper);
projectRouter.delete("/:id/papers/:paperId", projectController.removePaper);

projectRouter.post("/:id/members", projectController.addMember);
projectRouter.delete("/:id/members/:memberId", projectController.removeMember);
