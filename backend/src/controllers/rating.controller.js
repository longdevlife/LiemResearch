import mongoose from 'mongoose';
import { Paper } from '../models/Paper.js';
import { Rating } from '../models/Rating.js';
import { syncUserPoints } from '../utils/points.js';
import {
  notifyAdminsPaperRated,
  notifyAdminsPaperRatingDeleted,
  notifyAdminsPaperRatingUpdated,
  notifyPaperContributorsCommented,
} from '../utils/notification.js';

function isInvalidId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function normalizeRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) ? rating : NaN;
}

async function refreshPaperRatingStats(paperId) {
  const stats = await Rating.aggregate([
    { $match: { paper: new mongoose.Types.ObjectId(paperId) } },
    {
      $group: {
        _id: '$paper',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const nextStats = stats[0] || { averageRating: 0, totalRatings: 0 };

  await Paper.findByIdAndUpdate(paperId, {
    averageRating: Number(nextStats.averageRating.toFixed?.(1) || 0),
    totalRatings: nextStats.totalRatings,
  });
}

async function notifyPaperCommentRecipients({ paper, commenter, comment }) {
  if (!comment.trim() || commenter.role !== 'user') {
    return;
  }

  try {
    await notifyPaperContributorsCommented({
      paperId: paper._id,
      paperTitle: paper.title,
      commenterName: commenter.fullName,
      actorId: commenter._id,
      recipientIds: [paper.requestedBy, paper.uploadedBy],
    });
  } catch (error) {
    console.error('Failed to create user notification for paper comment:', error);
  }
}

export async function createRating(req, res) {
  const { rating, comment = '' } = req.body;
  const { paperId } = req.params;

  if (isInvalidId(paperId)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const normalizedRating = normalizeRating(rating);
  if (normalizedRating < 1 || normalizedRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  const paper = await Paper.findById(paperId);
  if (!paper) {
    return res.status(404).json({ message: 'Paper not found' });
  }

  const existingRating = await Rating.findOne({ paper: paperId, user: req.user._id });
  if (existingRating) {
    return res.status(409).json({ message: 'You have already rated this paper', ratingId: existingRating._id });
  }

  const createdRating = await Rating.create({
    paper: paperId,
    user: req.user._id,
    rating: normalizedRating,
    comment: String(comment).trim(),
  });

  await refreshPaperRatingStats(paperId);
  await syncUserPoints(req.user._id);
  await notifyPaperCommentRecipients({
    paper,
    commenter: req.user,
    comment: String(comment),
  });

  if (req.user.role === 'user') {
    try {
      await notifyAdminsPaperRated({
        paperId: paper._id,
        paperTitle: paper.title,
        raterName: req.user.fullName,
        actorId: req.user._id,
        rating: normalizedRating,
      });
    } catch (error) {
      console.error('Failed to create admin notification for paper rating:', error);
    }
  }

  const populatedRating = await Rating.findById(createdRating._id).populate('user', 'fullName university');

  res.status(201).json({ rating: populatedRating });
}

export async function getPaperRatings(req, res) {
  const { paperId } = req.params;

  if (isInvalidId(paperId)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const ratings = await Rating.find({ paper: paperId })
    .populate('user', 'fullName university')
    .sort({ createdAt: -1 });

  res.json({ ratings });
}

export async function getRatingById(req, res) {
  if (isInvalidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid rating id' });
  }

  const rating = await Rating.findById(req.params.id)
    .populate('user', 'fullName university')
    .populate('paper', 'title doi');

  if (!rating) {
    return res.status(404).json({ message: 'Rating not found' });
  }

  res.json({ rating });
}

export async function updateRating(req, res) {
  const { rating, comment } = req.body;

  if (isInvalidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid rating id' });
  }

  const existingRating = await Rating.findById(req.params.id);
  if (!existingRating) {
    return res.status(404).json({ message: 'Rating not found' });
  }

  if (existingRating.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to update this rating' });
  }

  if (rating !== undefined) {
    const normalizedRating = normalizeRating(rating);
    if (normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    existingRating.rating = normalizedRating;
  }

  const previousComment = existingRating.comment || '';
  const nextComment = comment !== undefined ? String(comment).trim() : previousComment;

  if (comment !== undefined) {
    existingRating.comment = nextComment;
  }

  await existingRating.save();
  await refreshPaperRatingStats(existingRating.paper);

  if (req.user.role === 'user') {
    try {
      const paper = await Paper.findById(existingRating.paper).select('title requestedBy uploadedBy');
      await notifyAdminsPaperRatingUpdated({
        paperId: existingRating.paper,
        paperTitle: paper?.title || 'Unknown paper',
        raterName: req.user.fullName,
        actorId: req.user._id,
      });

      if (paper && comment !== undefined && nextComment && nextComment !== previousComment) {
        await notifyPaperCommentRecipients({
          paper,
          commenter: req.user,
          comment: nextComment,
        });
      }
    } catch (error) {
      console.error('Failed to create admin notification for rating update:', error);
    }
  }

  const updatedRating = await Rating.findById(existingRating._id).populate('user', 'fullName university');

  res.json({ rating: updatedRating });
}

export async function deleteRating(req, res) {
  if (isInvalidId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid rating id' });
  }

  const rating = await Rating.findById(req.params.id);
  if (!rating) {
    return res.status(404).json({ message: 'Rating not found' });
  }

  if (rating.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You do not have permission to delete this rating' });
  }

  const paperId = rating.paper;
  const userId = rating.user;
  const paper = await Paper.findById(paperId).select('title');
  await Rating.findByIdAndDelete(rating._id);
  await refreshPaperRatingStats(paperId);
  await syncUserPoints(userId);

  if (req.user.role === 'user') {
    try {
      await notifyAdminsPaperRatingDeleted({
        paperId,
        paperTitle: paper?.title || 'Unknown paper',
        raterName: req.user.fullName,
        actorId: req.user._id,
      });
    } catch (error) {
      console.error('Failed to create admin notification for rating deletion:', error);
    }
  }

  res.json({ message: 'Rating deleted successfully', ratingId: rating._id });
}
