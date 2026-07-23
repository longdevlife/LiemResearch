import type { FilterQuery } from "mongoose";
import type { PaperDoc } from "./models/paper.model.js";

export const OPENALEX_PAPER_STATUS = "not-downloaded" as const;

const PAPER_REQUEST_STATUSES = [
  "pending",
  "not-downloaded",
  "downloaded",
  "rejected",
  "pending-requester-acceptance",
] as const;

/** Only papers with a user request or PDF contribution belong in the admin workflow. */
export function buildUserPaperRequestFilter(status?: string): FilterQuery<PaperDoc> {
  return {
    paperStatus: status ?? { $in: PAPER_REQUEST_STATUSES },
    $or: [
      { requestedBy: { $exists: true, $ne: null } },
      { uploadedBy: { $exists: true, $ne: null } },
    ],
  };
}

export function isUserPaperRequest(
  paper: Pick<PaperDoc, "paperStatus" | "requestedBy" | "uploadedBy">,
): boolean {
  return paper.paperStatus === "pending" && Boolean(paper.requestedBy || paper.uploadedBy);
}
