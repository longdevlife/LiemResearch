import { Paper } from '../models/Paper.js';
import { Rating } from '../models/Rating.js';
import { User } from '../models/User.js';

export const PAPER_REQUEST_POINTS = 10;
export const RATING_POINTS = 5;
export const PDF_UPLOAD_POINTS = 10;

export async function calculateUserPointStats(userId) {
  const [requestedPapers, ratingsGiven] = await Promise.all([
    Paper.countDocuments({ requestedBy: userId }),
    Rating.countDocuments({ user: userId }),
  ]);

  const uploadedPapers = await Paper.countDocuments({
    uploadedBy: userId,
    pdfPath: { $exists: true, $ne: '' },
  });

  return {
    requestedPapers,
    ratingsGiven,
    uploadedPapers,
    points:
      requestedPapers * PAPER_REQUEST_POINTS +
      ratingsGiven * RATING_POINTS +
      uploadedPapers * PDF_UPLOAD_POINTS,
  };
}

export async function syncUserPoints(userId) {
  const stats = await calculateUserPointStats(userId);

  await User.findByIdAndUpdate(userId, { points: stats.points }, { runValidators: true });

  return stats;
}
