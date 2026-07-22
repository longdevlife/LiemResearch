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

/** Only user-submitted papers should appear in the admin approval queue. */
export function buildUserPaperRequestFilter(status?: string): FilterQuery<PaperDoc> {
  return {
    paperStatus: status ?? { $in: PAPER_REQUEST_STATUSES },
    requestedBy: { $exists: true, $ne: null },
  };
}

export function isUserPaperRequest(paper: Pick<PaperDoc, "paperStatus" | "requestedBy">): boolean {
  return paper.paperStatus === "pending" && Boolean(paper.requestedBy);
}
