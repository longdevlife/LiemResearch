import mongoose from "mongoose";
import { UserModel } from "./models/user.model.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { PaperDownloadModel } from "../papers/models/paper-download.model.js";

// ── Constants (mirrored from Legacy) ────────────────────────────────────────
export const REQUEST_PAPER_COST = 100;   // Credits deducted when creating a request
export const REDOWNLOAD_COST = 5;        // Credits deducted for re-downloading a PDF
export const INVALID_PDF_PENALTY = 0;    // Penalty points for rejected PDF upload

const APPROVED_STATUSES = ["not-downloaded", "downloaded"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toObjectId(id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Atomically charge the request fee ONLY if the user can afford it. Returns false
 * when the balance is insufficient (no deduction). The `credits: { $gte }` filter
 * makes the check-and-charge a single atomic op, so concurrent submits can't
 * overdraw and there is no separate read-then-write race.
 */
export async function chargePaperRequestCreditChecked(
  userId: string | mongoose.Types.ObjectId,
): Promise<boolean> {
  const updated = await UserModel.findOneAndUpdate(
    { _id: toObjectId(String(userId)), credits: { $gte: REQUEST_PAPER_COST } },
    { $inc: { credits: -REQUEST_PAPER_COST } },
  );
  return updated !== null;
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
 *   points = uploadCreditReward (from approved uploads) - penaltyPoints
 */
export async function syncUserPoints(userId: string | mongoose.Types.ObjectId): Promise<number> {
  const objectId = toObjectId(String(userId));

  const [uploadStats, userDoc] = await Promise.all([
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
    UserModel.findById(objectId).select("penaltyPoints").lean(),
  ]);

  const uploadReward = uploadStats[0]?.totalReward ?? 0;
  const penalty = userDoc?.penaltyPoints ?? 0;
  const points = Math.max(0, uploadReward - penalty);

  await UserModel.findByIdAndUpdate(objectId, { $set: { points } });
  return points;
}

/**
 * Reverse a previously-granted upload reward when an approval is REVOKED
 * (downloaded → rejected). Atomically clears `uploadRewardedAt` first, so a
 * concurrent double-revoke can only claw back once; then deducts the reward.
 */
export async function clawbackUploadReward(paper: {
  _id: mongoose.Types.ObjectId;
  uploadedBy?: mongoose.Types.ObjectId | null;
  uploadCreditReward?: number;
}): Promise<void> {
  if (!paper.uploadedBy) return;
  // Only the caller that actually clears the "rewarded" flag performs the deduction.
  const cleared = await PaperModel.findOneAndUpdate(
    { _id: paper._id, uploadRewardedAt: { $exists: true, $ne: null } },
    { $unset: { uploadRewardedAt: "" } },
  );
  if (!cleared) return;
  const reward = paper.uploadCreditReward ?? 0;
  if (reward > 0) {
    await UserModel.findByIdAndUpdate(paper.uploadedBy, { $inc: { credits: -reward } });
  }
  await syncUserPoints(String(paper.uploadedBy));
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
