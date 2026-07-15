import { beforeEach, describe, expect, it, vi } from "vitest";
import { gapsService } from "../gaps.service.js";
import { GapAnalysisModel } from "../models/gap-analysis.model.js";

vi.mock("../models/gap-analysis.model.js", () => ({
  GapAnalysisModel: {
    findOne: vi.fn(),
  },
}));

describe("gapsService.getActiveAnalysis", () => {
  beforeEach(() => {
    vi.mocked(GapAnalysisModel.findOne).mockReset();
  });

  it("returns the latest queued or analyzing analysis owned by the user", async () => {
    const lean = vi.fn().mockResolvedValue({
      _id: "analysis-1",
      topic: "LLM evaluation",
      status: "analyzing",
      gapIds: ["gap-1"],
      errorMessage: undefined,
    });
    const sort = vi.fn().mockReturnValue({ lean });
    vi.mocked(GapAnalysisModel.findOne).mockReturnValue({ sort } as never);

    await expect(gapsService.getActiveAnalysis("user-1")).resolves.toEqual({
      id: "analysis-1",
      topic: "LLM evaluation",
      status: "analyzing",
      gapIds: ["gap-1"],
      errorMessage: undefined,
    });

    expect(GapAnalysisModel.findOne).toHaveBeenCalledWith({
      userId: "user-1",
      status: { $in: ["queued", "analyzing"] },
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it("returns null when the user has no active analysis", async () => {
    const lean = vi.fn().mockResolvedValue(null);
    const sort = vi.fn().mockReturnValue({ lean });
    vi.mocked(GapAnalysisModel.findOne).mockReturnValue({ sort } as never);

    await expect(gapsService.getActiveAnalysis("user-1")).resolves.toBeNull();
  });
});
