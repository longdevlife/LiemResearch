import { Paper } from '../models/Paper.js';
import { PaperDownload } from '../models/PaperDownload.js';
import { Rating } from '../models/Rating.js';
import { User } from '../models/User.js';

export const REQUEST_PAPER_COST = 100;
export const REDOWNLOAD_COST = 5;
export const RATING_POINTS = 5;
export const INVALID_PAPER_PENALTY = 0;
export const INVALID_PDF_PENALTY = 0;

const validPaperStatuses = ['approved', 'not-downloaded', 'downloaded'];

export async function calculateUserPointStats(userId) {
  const [user, requestedPapers, uploadedPdfPapers, ratedPaperIds, rejectedPapers, rejectedPdfs] = await Promise.all([
    User.findById(userId).select('penaltyPoints'),
    Paper.countDocuments({
      requestedBy: userId,
      status: { $in: validPaperStatuses },
    }),
    Paper.find({
      uploadedBy: userId,
      status: 'downloaded',
      pdfPath: { $exists: true, $ne: '' },
    }).select('uploadCreditReward'),
    Rating.distinct('paper', { user: userId }),
    Paper.countDocuments({
      requestedBy: userId,
      status: 'rejected',
    }),
    Paper.countDocuments({
      uploadedBy: userId,
      status: 'rejected',
      pdfPath: { $exists: true, $ne: '' },
    }),
  ]);

  const ratingsGiven = await Paper.countDocuments({ _id: { $in: ratedPaperIds } });
  const uploadCreditReward = uploadedPdfPapers.reduce((sum, paper) => sum + (paper.uploadCreditReward || 0), 0);

  return {
    uploadedPapers: requestedPapers,
    uploadedPdfs: uploadedPdfPapers.length,
    ratingsGiven,
    rejectedPapers,
    rejectedPdfs,
    penaltyPoints: user?.penaltyPoints || 0,
    requestedPapers,
    uploadCreditReward,
    points:
      uploadCreditReward +
      ratingsGiven * RATING_POINTS -
      rejectedPapers * INVALID_PAPER_PENALTY -
      rejectedPdfs * INVALID_PDF_PENALTY -
      (user?.penaltyPoints || 0),
  };
}

export async function syncUserPoints(userId) {
  const stats = await calculateUserPointStats(userId);

  await User.findByIdAndUpdate(userId, { points: stats.points }, { runValidators: true });

  return stats;
}

export async function recordInvalidPdfUpload(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { penaltyPoints: INVALID_PDF_PENALTY } });
  return syncUserPoints(userId);
}

export async function chargePaperRequestCredit(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { credits: -REQUEST_PAPER_COST } });
}

export async function rewardPaperUploadCredit(userId, reward) {
  if (!userId || !reward) return;
  await User.findByIdAndUpdate(userId, { $inc: { credits: reward } });
}

export async function chargePaperDownloadCredit({ userId, paper }) {
  if (!userId || !paper) return { cost: 0, isRepeatDownload: false };

  const existingDownload = await PaperDownload.findOne({ user: userId, paper: paper._id });
  const cost = existingDownload ? REDOWNLOAD_COST : paper.downloadCost || 0;

  if (cost > 0) {
    await User.findByIdAndUpdate(userId, { $inc: { credits: -cost } });
  }

  if (!existingDownload) {
    await PaperDownload.create({ user: userId, paper: paper._id, cost });
  }

  return { cost, isRepeatDownload: Boolean(existingDownload) };
}
