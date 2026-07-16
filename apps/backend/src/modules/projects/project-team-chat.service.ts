import type { ProjectTeamChatMessage } from "@trend/shared-types";
import mongoose from "mongoose";
import { AppError } from "../../common/exceptions/app-error.js";
import { ProjectModel } from "./models/project.model.js";
import { ProjectTeamMessageModel } from "./models/project-team-message.model.js";
import { canAccessProject } from "./project-scope.js";

interface ListTeamMessagesOptions {
  limit: number;
  before?: string;
}

type TeamMessageDoc = {
  _id: unknown;
  projectId: unknown;
  senderId:
    | unknown
    | {
        _id?: unknown;
        fullName?: string;
        email?: string;
        avatarUrl?: string;
      };
  content: string;
  createdAt: Date;
};

export class ProjectTeamChatService {
  async sendMessage(
    projectId: string,
    userId: string,
    content: string,
  ): Promise<ProjectTeamChatMessage> {
    await this.assertCanAccess(projectId, userId);
    const trimmed = content.trim();
    if (!trimmed) throw AppError.badRequest("Message content is required");

    const created = await ProjectTeamMessageModel.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      senderId: new mongoose.Types.ObjectId(userId),
      content: trimmed,
    });

    const doc = await ProjectTeamMessageModel.findById(created._id)
      .populate("senderId", "fullName email avatarUrl")
      .lean();
    if (!doc) throw AppError.internal("Team message was created but could not be loaded");
    return toTeamChatMessage(doc as unknown as TeamMessageDoc);
  }

  async listMessages(
    projectId: string,
    userId: string,
    options: ListTeamMessagesOptions,
  ): Promise<ProjectTeamChatMessage[]> {
    await this.assertCanAccess(projectId, userId);
    const filter: Record<string, unknown> = {
      projectId: new mongoose.Types.ObjectId(projectId),
    };
    if (options.before) {
      filter.createdAt = { $lt: new Date(options.before) };
    }

    const docs = await ProjectTeamMessageModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .populate("senderId", "fullName email avatarUrl")
      .lean();

    return docs
      .reverse()
      .map((doc) => toTeamChatMessage(doc as unknown as TeamMessageDoc));
  }

  private async assertCanAccess(projectId: string, userId: string): Promise<void> {
    const project = await ProjectModel.findById(projectId).select("ownerId members").lean();
    if (!project) throw AppError.notFound("Project not found");
    if (!canAccessProject(project, userId)) {
      throw AppError.forbidden("Access denied to this project");
    }
  }
}

function toTeamChatMessage(doc: TeamMessageDoc): ProjectTeamChatMessage {
  const sender =
    doc.senderId && typeof doc.senderId === "object" && "_id" in doc.senderId
      ? (doc.senderId as {
          _id?: unknown;
          fullName?: string;
          email?: string;
          avatarUrl?: string;
        })
      : { _id: doc.senderId };

  return {
    id: String(doc._id),
    projectId: String(doc.projectId),
    sender: {
      id: String(sender._id ?? ""),
      fullName: sender.fullName,
      email: sender.email,
      avatarUrl: sender.avatarUrl,
    },
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
  };
}

export const projectTeamChatService = new ProjectTeamChatService();
