import mongoose from 'mongoose';
import { Paper } from '../models/Paper.js';
import { getPdfDownloadUrl } from '../utils/s3.js';

const visibleStatuses = ['approved', 'downloaded', 'not-downloaded'];

function isInvalidPaperId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function buildSearchFilter(query) {
  const filter = { status: { $in: visibleStatuses } };
  const andConditions = [];

  if (query.search) {
    andConditions.push({
      $or: [
        { title: { $regex: query.search, $options: 'i' } },
        { doi: { $regex: query.search, $options: 'i' } },
        { paperLink: { $regex: query.search, $options: 'i' } },
        { abstract: { $regex: query.search, $options: 'i' } },
        { authors: { $regex: query.search, $options: 'i' } },
        { journal: { $regex: query.search, $options: 'i' } },
        { keywords: { $regex: query.search, $options: 'i' } },
      ],
    });
  }

  if (query.year && Number.isInteger(Number(query.year))) {
    filter.publishedYear = Number(query.year);
  }

  if (query.hasPdf === 'true') {
    filter.pdfPath = { $exists: true, $ne: '' };
  }

  if (query.hasPdf === 'false') {
    andConditions.push({
      $or: [{ pdfPath: { $exists: false } }, { pdfPath: '' }],
    });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
}

function buildSort(sortBy) {
  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    yearDesc: { publishedYear: -1 },
    yearAsc: { publishedYear: 1 },
    rating: { averageRating: -1, totalRatings: -1 },
    downloads: { downloadCount: -1 },
  };

  return sortOptions[sortBy] || sortOptions.newest;
}

export async function searchPublicPapers(req, res) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const filter = buildSearchFilter(req.query);

  const [papers, total] = await Promise.all([
    Paper.find(filter)
      .populate('requestedBy', 'fullName university')
      .populate('uploadedBy', 'fullName university')
      .sort(buildSort(req.query.sortBy))
      .skip(skip)
      .limit(limit),
    Paper.countDocuments(filter),
  ]);

  res.json({
    papers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getPublicPaperById(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findOne({
    _id: req.params.id,
    status: { $in: visibleStatuses },
  })
    .populate('requestedBy', 'fullName university')
    .populate('uploadedBy', 'fullName university');

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ paper });
}

export async function recordPaperView(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findOneAndUpdate(
    { _id: req.params.id, status: { $in: visibleStatuses } },
    { $inc: { viewCount: 1 } },
    { new: true }
  );

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ viewCount: paper.viewCount });
}

export async function downloadPublicPaper(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findOneAndUpdate(
    {
      _id: req.params.id,
      status: 'downloaded',
      pdfPath: { $exists: true, $ne: '' },
    },
    { $inc: { downloadCount: 1 } },
    { new: true }
  );

  if (!paper) return res.status(404).json({ message: 'PDF is not available for this paper' });

  const filename = `${paper.doi || paper.title}.pdf`;
  const downloadUrl = await getPdfDownloadUrl(paper.pdfPath, filename);

  res.json({
    downloadUrl,
    downloadCount: paper.downloadCount,
  });
}
