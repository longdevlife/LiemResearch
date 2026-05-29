import { User } from '../models/User.js';
import { syncUserPoints } from '../utils/points.js';

const activeUserFilter = {
  role: 'user',
  $or: [{ status: 'active' }, { status: { $exists: false } }],
};

async function buildUserStats(user) {
  const stats = await syncUserPoints(user._id);

  return {
    user: { ...user.toSafeObject(), points: stats.points },
    ...stats,
  };
}

export async function getTopUsers(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);

    const rankings = await buildRankings();

    const total = rankings.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * limit;

    res.json({
      rankings: rankings.slice(skip, skip + limit),
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('getTopUsers error', err);
    res.status(500).json({ message: err instanceof Error ? err.message : 'Internal server error' });
  }
}

async function buildRankings() {
  const users = await User.find(activeUserFilter).sort({ createdAt: 1 });
  const stats = await Promise.all(users.map(buildUserStats));

  return stats
    .sort((left, right) => right.points - left.points || left.user.fullName.localeCompare(right.user.fullName))
    .map((item, index) => ({ rank: index + 1, ...item }));
}

export async function getMyRanking(req, res) {
  if (req.user.role !== 'user') {
    return res.status(404).json({ message: 'Ranking is only available for user accounts' });
  }

  const rankings = await buildRankings();

  const ranking = rankings.find((item) => item.user._id.toString() === req.user._id.toString());

  if (!ranking) {
    return res.status(404).json({ message: 'Ranking not found for current user' });
  }

  res.json({ ranking });
}

export async function getUserRankingById(req, res) {
  const rankings = await buildRankings();
  const ranking = rankings.find((item) => item.user._id.toString() === req.params.id.toString());

  if (!ranking) {
    return res.status(404).json({ message: 'Ranking not found for user' });
  }

  res.json({ ranking });
}
