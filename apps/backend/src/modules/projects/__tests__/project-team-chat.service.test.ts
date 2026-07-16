import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../common/exceptions/app-error.js";
import { ProjectModel } from "../models/project.model.js";
import { ProjectTeamMessageModel } from "../models/project-team-message.model.js";
import { projectTeamChatService } from "../project-team-chat.service.js";

vi.mock("../models/project.model.js", () => ({
  ProjectModel: {
    findById: vi.fn(),
  },
}));

vi.mock("../models/project-team-message.model.js", () => ({
  ProjectTeamMessageModel: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

function queryReturning<T>(value: T) {
  return {
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

function messageQueryReturning<T>(value: T) {
  return {
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe("projectTeamChatService", () => {
  const projectId = new mongoose.Types.ObjectId().toString();
  const ownerId = new mongoose.Types.ObjectId().toString();
  const memberId = new mongoose.Types.ObjectId().toString();
  const outsiderId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lets a project member send a team message without credit or LLM work", async () => {
    vi.mocked(ProjectModel.findById).mockReturnValue(
      queryReturning({
        _id: projectId,
        ownerId,
        members: [{ targetId: memberId, role: "member" }],
      }) as any,
    );
    vi.mocked(ProjectTeamMessageModel.create).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
    } as any);
    const createdAt = new Date("2026-07-16T04:00:00.000Z");
    vi.mocked(ProjectTeamMessageModel.findById).mockReturnValue(
      messageQueryReturning({
        _id: new mongoose.Types.ObjectId(),
        projectId,
        senderId: { _id: memberId, fullName: "Member One", email: "member@test.local" },
        content: "Please review paper 3",
        createdAt,
      }) as any,
    );

    const result = await projectTeamChatService.sendMessage(projectId, memberId, " Please review paper 3 ");

    expect(ProjectTeamMessageModel.create).toHaveBeenCalledWith({
      projectId: new mongoose.Types.ObjectId(projectId),
      senderId: new mongoose.Types.ObjectId(memberId),
      content: "Please review paper 3",
    });
    expect(result).toMatchObject({
      projectId,
      sender: { id: memberId, fullName: "Member One", email: "member@test.local" },
      content: "Please review paper 3",
      createdAt: createdAt.toISOString(),
    });
  });

  it("rejects users outside the project", async () => {
    vi.mocked(ProjectModel.findById).mockReturnValue(
      queryReturning({
        _id: projectId,
        ownerId,
        members: [{ targetId: memberId, role: "member" }],
      }) as any,
    );

    await expect(projectTeamChatService.sendMessage(projectId, outsiderId, "hello")).rejects.toThrow(
      AppError,
    );
    expect(ProjectTeamMessageModel.create).not.toHaveBeenCalled();
  });

  it("lists newest messages in chronological order for display", async () => {
    vi.mocked(ProjectModel.findById).mockReturnValue(
      queryReturning({
        _id: projectId,
        ownerId,
        members: [{ targetId: memberId, role: "member" }],
      }) as any,
    );
    const older = {
      _id: new mongoose.Types.ObjectId(),
      projectId,
      senderId: { _id: ownerId, fullName: "Owner", email: "owner@test.local" },
      content: "First",
      createdAt: new Date("2026-07-16T04:00:00.000Z"),
    };
    const newer = {
      _id: new mongoose.Types.ObjectId(),
      projectId,
      senderId: { _id: memberId, fullName: "Member", email: "member@test.local" },
      content: "Second",
      createdAt: new Date("2026-07-16T04:01:00.000Z"),
    };
    vi.mocked(ProjectTeamMessageModel.find).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      populate: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([newer, older]),
    } as any);

    const messages = await projectTeamChatService.listMessages(projectId, memberId, { limit: 20 });

    expect(messages.map((message) => message.content)).toEqual(["First", "Second"]);
  });
});
