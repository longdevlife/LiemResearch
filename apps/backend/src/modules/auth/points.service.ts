import mongoose from "mongoose";
import { UserModel } from "./models/user.model.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { PaperDownloadModel } from "../papers/models/paper-download.model.js";
import { UserRatingModel } from "../quality/models/user-rating.model.js";

// ── Constants (mirrored from Legacy) ────────────────────────────────────────
export const REQUEST_PAPER_COST = 100;   // Credits deducted when creating a request
export const REDOWNLOAD_COST = 5;        // Credits deducted for re-downloading a PDF
export const INVALID_PDF_PENALTY = 0;    // Penalty points for rejected PDF upload
export const RATING_POINTS = 5;          // Points earned per rating given (mirrors legacy)

const APPROVED_STATUSES = ["not-downloaded", "downloaded"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Deduct REQUEST_PAPER_COST credits when a user creates a new paper request. */
export async function chargePaperRequestCredit(userId: string | mongoose.Types.ObjectId): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { $inc: { credits: -REQUEST_PAPER_COST } });
}

/** Refund REQUEST_PAPER_COST credits when a request is cancelled or admin-rejected. */
export async function refundPaperRequestCredit(userId: string | mongoose.Types.ObjectId): Promise<void> {
  await UserModel.findByIdAndUpdate(userId, { $inc: { credits: REQUEST_PAPER_COST } });
}

/** Add upload credit reward to user when their PDF upload gets accepted. */
export async function rewardPaperUploadCredit(
  userId: string | mongoose.Types.ObjectId,
  reward: number,
): Promise<void> {
  if (!userId || !reward) return;
  await UserModel.findByIdAndUpdate(userId, { $inc: { credits: reward } });
  await syncUserPoints(String(userId));
}

/**
 * Charge download credits when a user downloads a PDF.
 * - First download: charge paper.downloadCost (from quality tier).
 * - Subsequent downloads: charge REDOWNLOAD_COST (5 credits).
 * Returns the cost charged and whether it was a re-download.
 */
export async function chargePaperDownloadCredit({
  userId,
  paper,
}: {
  userId: string | mongoose.Types.ObjectId;
  paper: { _id: mongoose.Types.ObjectId; downloadCost?: number | null };
}): Promise<{ cost: number; isRepeatDownload: boolean }> {
  if (!userId || !paper) return { cost: 0, isRepeatDownload: false };

  const existingDownload = await PaperDownloadModel.findOne({
    user: toObjectId(String(userId)),
    paper: paper._id,
  });

  const cost = existingDownload ? REDOWNLOAD_COST : (paper.downloadCost ?? 0);

  if (cost > 0) {
    await UserModel.findByIdAndUpdate(userId, { $inc: { credits: -cost } });
  }

  if (!existingDownload) {
    await PaperDownloadModel.create({
      user: toObjectId(String(userId)),
      paper: paper._id,
      cost,
    });
  }

  return { cost, isRepeatDownload: Boolean(existingDownload) };
}

/** Record an invalid PDF upload penalty (currently 0 — reserved for future use). */
export async function recordInvalidPdfUpload(userId: string | mongoose.Types.ObjectId): Promise<void> {
  if (INVALID_PDF_PENALTY > 0) {
    await UserModel.findByIdAndUpdate(userId, { $inc: { penaltyPoints: INVALID_PDF_PENALTY } });
  }
  await syncUserPoints(String(userId));
}

/**
 * Aggregate total points for a user from all sources and sync the `points` field.
 * Formula (mirrors Legacy):
 *   points = uploadCreditReward + ratingsGiven * RATING_POINTS - penaltyPoints
 */
export async function syncUserPoints(userId: string | mongoose.Types.ObjectId): Promise<number> {
  const objectId = toObjectId(String(userId));

  const [uploadStats, ratingStats, userDoc] = await Promise.all([
    // Sum upload credit rewards from approved PDFs
    PaperModel.aggregate<{ totalReward: number }>([
      {
        $match: {
          uploadedBy: objectId,
          paperStatus: { $in: APPROVED_STATUSES },
          pdfPath: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: null,
          totalReward: { $sum: { $ifNull: ["$uploadCreditReward", 0] } },
        },
      },
    ]),
    // Count unique ratings given by this user
    UserRatingModel.aggregate<{ count: number }>([
      { $match: { userId: objectId } },
      { $count: "count" },
    ]),
    // Get penalty points from user document
    UserModel.findById(objectId).select("penaltyPoints").lean(),
  ]);

  const uploadReward = uploadStats[0]?.totalReward ?? 0;
  const ratingsGiven = ratingStats[0]?.count ?? 0;
  const penalty = userDoc?.penaltyPoints ?? 0;
  const points = Math.max(0, uploadReward + ratingsGiven * RATING_POINTS - penalty);

  await UserModel.findByIdAndUpdate(objectId, { $set: { points } });
  return points;
}

/**
 * Calculate detailed ranking stats for a user (used by /rankings/me).
 * Returns stats breakdown without modifying the database.
 */
export async function calculateUserRankingStats(userId: string | mongoose.Types.ObjectId): Promise<{
  points: number;
  uploadCreditReward: number;
  uploadedPdfs: number;
  requestedPapers: number;
  ratingsGiven: number;
  penaltyPoints: number;
}> {
  const objectId = toObjectId(String(userId));

  const [uploadStats, paperStats, ratingStats, userDoc] = await Promise.all([
    PaperModel.aggregate<{ totalReward: number; uploadedPdfs: number }>([
      {
        $match: {
          uploadedBy: objectId,
          paperStatus: { $in: APPROVED_STATUSES },
          pdfPath: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: null,
          totalReward: { $sum: { $ifNull: ["$uploadCreditReward", 0] } },
          uploadedPdfs: { $sum: 1 },
        },
      },
    ]),
    PaperModel.aggregate<{ requestedPapers: number }>([
      {
        $match: {
          requestedBy: objectId,
          paperStatus: { $in: [...APPROVED_STATUSES, "pending", "rejected"] },
        },
      },
      { $count: "requestedPapers" },
    ]),
    UserRatingModel.aggregate<{ count: number }>([
      { $match: { userId: objectId } },
      { $count: "count" },
    ]),
    UserModel.findById(objectId).select("penaltyPoints").lean(),
  ]);

  const uploadCreditReward = uploadStats[0]?.totalReward ?? 0;
  const uploadedPdfs = uploadStats[0]?.uploadedPdfs ?? 0;
  const requestedPapers = paperStats[0]?.requestedPapers ?? 0;
  const ratingsGiven = ratingStats[0]?.count ?? 0;
  const penaltyPoints = userDoc?.penaltyPoints ?? 0;
  const points = Math.max(0, uploadCreditReward + ratingsGiven * RATING_POINTS - penaltyPoints);

  return { points, uploadCreditReward, uploadedPdfs, requestedPapers, ratingsGiven, penaltyPoints };
}

/** Apply the upload credit reward to the PDF uploader when status becomes 'downloaded'. */
export async function applyUploadCreditReward(paper: {
  _id: mongoose.Types.ObjectId;
  uploadedBy?: mongoose.Types.ObjectId | null;
  paperStatus?: string;
  uploadCreditReward?: number;
  uploadRewardedAt?: Date | null;
}): Promise<void> {
  if (!paper.uploadedBy || paper.paperStatus !== "downloaded" || paper.uploadRewardedAt) return;

  const reward = paper.uploadCreditReward ?? 0;
  if (reward > 0) {
    await rewardPaperUploadCredit(paper.uploadedBy, reward);
  }

  // Mark as rewarded so it doesn't fire twice
  await PaperModel.findByIdAndUpdate(paper._id, { uploadRewardedAt: new Date() });
}
