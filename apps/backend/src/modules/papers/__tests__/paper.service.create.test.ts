import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const paperModel = vi.hoisted(() => ({
  findOne: vi.fn(),
  create: vi.fn(),
}));

const userModel = vi.hoisted(() => ({
  findById: vi.fn(),
}));

const notifications = vi.hoisted(() => ({
  create: vi.fn(),
}));

const points = vi.hoisted(() => ({
  chargePaperRequestCreditChecked: vi.fn(),
  refundPaperRequestCredit: vi.fn(),
  rewardPaperUploadCredit: vi.fn(),
  recordInvalidPdfUpload: vi.fn(),
  chargePaperDownloadCredit: vi.fn(),
  syncUserPoints: vi.fn(),
  applyUploadCreditReward: vi.fn(),
  clawbackUploadReward: vi.fn(),
  REQUEST_PAPER_COST: 100,
}));

vi.mock("../models/paper.model.js", () => ({
  PaperModel: paperModel,
}));

vi.mock("../models/paper-download.model.js", () => ({
  PaperDownloadModel: {
    findOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../../auth/models/user.model.js", () => ({
  UserModel: userModel,
}));

vi.mock("../../notifications/notification.service.js", () => ({
  notificationService: notifications,
}));

vi.mock("../../auth/points.service.js", () => points);

const { paperService } = await import("../paper.service.js");

const validInput = {
  title: "Mobile API Optional PDF Smoke Test",
  doi: "10.1234/mobile.optional.pdf",
  paperLink: "https://example.com/mobile-optional-pdf",
  abstractText:
    "This abstract verifies optional PDF submission for a mobile workflow. It contains enough words to satisfy validation and describes metadata, authors, topics, keywords, project linkage, and review behavior in the publication trend system without attaching a local document file.",
  publicationYear: 2025,
  paperKind: "article" as const,
  authors: [{ displayName: "Codex Tester", position: 1, isCorresponding: true }],
  keywords: [{ keywordName: "mobile api" }],
  topics: [{ topicName: "Mobile Integration" }],
  openAccessUrl: "https://example.com/mobile-optional-pdf/fulltext",
};

describe("paperService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paperModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    points.chargePaperRequestCreditChecked.mockResolvedValue(true);
    points.syncUserPoints.mockResolvedValue(undefined);
    notifications.create.mockResolvedValue(undefined);
    userModel.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ fullName: "Codex Tester" }),
    });
  });

  it("allows a non-admin paper request without an attached PDF", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const createdId = new mongoose.Types.ObjectId();
    paperModel.create.mockResolvedValue({
      _id: createdId,
      ...validInput,
      externalIds: { doi: validInput.doi },
      primaryProvider: "user",
      dataStatus: "draft",
      paperStatus: "pending",
      requestedBy: new mongoose.Types.ObjectId(userId),
      pdfPath: undefined,
    });

    const result = await paperService.create(userId, false, validInput);

    expect(result.id).toBe(String(createdId));
    expect(paperModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: validInput.title,
        paperStatus: "pending",
        dataStatus: "draft",
        pdfPath: undefined,
        uploadedBy: undefined,
        uploadedAt: undefined,
      }),
    );
    expect(points.chargePaperRequestCreditChecked).toHaveBeenCalledWith(userId);
  });
});
