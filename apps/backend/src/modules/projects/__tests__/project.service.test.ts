import { describe, expect, it, vi, beforeEach } from "vitest";
import { projectService } from "../project.service.js";
import { ProjectModel } from "../models/project.model.js";
import { AppError } from "../../../common/exceptions/app-error.js";
import mongoose from "mongoose";

// Mock the Mongoose model
vi.mock("../models/project.model.js", () => {
  return {
    ProjectModel: {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndDelete: vi.fn(),
    }
  };
});

describe("ProjectService", () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const projectId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProjectsByUser", () => {
    it("should return projects for the user", async () => {
      const mockProjects = [{ _id: projectId, title: "Test Project" }];
      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProjects),
      };
      vi.mocked(ProjectModel.find).mockReturnValue(mockQuery as any);

      const result = await projectService.getProjectsByUser(userId);
      expect(result).toEqual(mockProjects);
      expect(ProjectModel.find).toHaveBeenCalled();
    });
  });

  describe("getProjectById", () => {
    it("should return project if user is owner", async () => {
      const mockProject = {
        _id: projectId,
        ownerId: userId,
        members: [],
      };
      vi.mocked(ProjectModel.findById).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProject),
      } as any);

      const result = await projectService.getProjectById(projectId, userId);
      expect(result).toEqual(mockProject);
    });

    it("should return project if user is a member", async () => {
      const mockProject = {
        _id: projectId,
        ownerId: new mongoose.Types.ObjectId().toString(),
        members: [{ targetId: userId, targetKind: "User", role: "member" }],
      };
      vi.mocked(ProjectModel.findById).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProject),
      } as any);

      const result = await projectService.getProjectById(projectId, userId);
      expect(result).toEqual(mockProject);
    });

    it("should throw 403 if user has no access", async () => {
      const mockProject = {
        _id: projectId,
        ownerId: new mongoose.Types.ObjectId().toString(),
        members: [],
      };
      vi.mocked(ProjectModel.findById).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProject),
      } as any);

      await expect(projectService.getProjectById(projectId, userId)).rejects.toThrow(AppError);
    });

    it("should throw 404 if project not found", async () => {
      vi.mocked(ProjectModel.findById).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(projectService.getProjectById(projectId, userId)).rejects.toThrow(AppError);
    });
  });
});
