import type { Request, Response } from "express";
import { projectChatService } from "./project-chat.service.js";

export class ProjectChatController {
  async sendMessage(req: Request, res: Response) {
    const projectId = req.params.id as string;
    const userId = req.user!.sub;
    const message = (req.body as { message: string }).message;
    const result = await projectChatService.sendMessage(projectId, userId, message);
    res.json({ success: true, data: result, meta: null });
  }

  async listHistory(req: Request, res: Response) {
    const projectId = req.params.id as string;
    const userId = req.user!.sub;
    const limit = (req.query as unknown as { limit: number }).limit;
    const messages = await projectChatService.listHistory(projectId, userId, limit);
    res.json({ success: true, data: { messages }, meta: { count: messages.length } });
  }
}

export const projectChatController = new ProjectChatController();
