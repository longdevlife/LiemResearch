import { User } from '../models/User.js';
import { syncUserPoints } from '../utils/points.js';

async function buildUserStats(user) {
  const stats = await syncUserPoints(user._id);

  return {
    user: { ...user.toSafeObject(), points: stats.points },
    ...stats,
  };
}

export async function getTopUsers(req, res) {
  const users = await User.find({ role: 'user', status: 'active' }).sort({ createdAt: 1 });
  const stats = await Promise.all(users.map(buildUserStats));

  const rankings = stats
    .sort((left, right) => right.points - left.points || left.user.fullName.localeCompare(right.user.fullName))
    .slice(0, 50)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  res.json({ rankings });
}

export async function getMyRanking(req, res) {
  const users = await User.find({ role: 'user', status: 'active' }).sort({ createdAt: 1 });
  const stats = await Promise.all(users.map(buildUserStats));
  const rankings = stats
    .sort((left, right) => right.points - left.points || left.user.fullName.localeCompare(right.user.fullName))
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  const ranking = rankings.find((item) => item.user._id.toString() === req.user._id.toString());

  if (!ranking) {
    return res.status(404).json({ message: 'Ranking not found for current user' });
  }

  res.json({ ranking });
}
