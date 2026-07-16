import type { Request, Response } from "express";
import { projectTeamChatService } from "./project-team-chat.service.js";

export class ProjectTeamChatController {
  async sendMessage(req: Request, res: Response) {
    const projectId = req.params.id as string;
    const userId = req.user!.sub;
    const content = (req.body as { content: string }).content;
    const message = await projectTeamChatService.sendMessage(projectId, userId, content);
    res.status(201).json({ success: true, data: { message }, meta: null });
  }

  async listMessages(req: Request, res: Response) {
    const projectId = req.params.id as string;
    const userId = req.user!.sub;
    const query = req.query as unknown as { limit: number; before?: string };
    const messages = await projectTeamChatService.listMessages(projectId, userId, query);
    res.json({ success: true, data: { messages }, meta: { count: messages.length } });
  }
}

export const projectTeamChatController = new ProjectTeamChatController();
