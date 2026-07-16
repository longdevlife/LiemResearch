import { Router } from "express";
import { validate } from "../../common/middleware/validate.js";
import {
  ListProjectTeamChatQuerySchema,
  ProjectTeamChatParamsSchema,
  SendProjectTeamChatMessageSchema,
} from "./dto/project-team-chat.schema.js";
import { projectTeamChatController } from "./project-team-chat.controller.js";

export const projectTeamChatRouter: Router = Router({ mergeParams: true });

projectTeamChatRouter.post(
  "/",
  validate(ProjectTeamChatParamsSchema, "params"),
  validate(SendProjectTeamChatMessageSchema),
  projectTeamChatController.sendMessage,
);

projectTeamChatRouter.get(
  "/",
  validate(ProjectTeamChatParamsSchema, "params"),
  validate(ListProjectTeamChatQuerySchema, "query"),
  projectTeamChatController.listMessages,
);
