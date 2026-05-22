import { Paper } from '../models/Paper.js';
import { Rating } from '../models/Rating.js';
import { User } from '../models/User.js';

export const PAPER_UPLOAD_POINTS = 50;
export const PDF_UPLOAD_POINTS = 50;
export const RATING_POINTS = 5;
export const INVALID_PAPER_PENALTY = 10;
export const INVALID_PDF_PENALTY = 10;

const validPaperStatuses = ['approved', 'not-downloaded', 'downloaded'];

export async function calculateUserPointStats(userId) {
  const [user, uploadedPapers, uploadedPdfs, ratingsGiven, rejectedPapers, rejectedPdfs] = await Promise.all([
    User.findById(userId).select('penaltyPoints'),
    Paper.countDocuments({
      requestedBy: userId,
      status: { $in: validPaperStatuses },
    }),
    Paper.countDocuments({
      uploadedBy: userId,
      status: 'downloaded',
      pdfPath: { $exists: true, $ne: '' },
    }),
    Rating.countDocuments({ user: userId }),
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

  return {
    uploadedPapers,
    uploadedPdfs,
    ratingsGiven,
    rejectedPapers,
    rejectedPdfs,
    penaltyPoints: user?.penaltyPoints || 0,
    requestedPapers: uploadedPapers,
    points:
      uploadedPapers * PAPER_UPLOAD_POINTS +
      uploadedPdfs * PDF_UPLOAD_POINTS +
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
