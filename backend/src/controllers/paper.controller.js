import mongoose from 'mongoose';
import { Paper } from '../models/Paper.js';

const allowedStatuses = ['pending', 'approved', 'rejected', 'downloaded', 'not-downloaded'];

function isInvalidPaperId(id) {
  return !mongoose.Types.ObjectId.isValid(id);
}

function normalizeKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords.map((item) => String(item).trim()).filter(Boolean);
  if (typeof keywords === 'string') return keywords.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

export async function createPaper(req, res) {
  const { title, doi, paperLink, abstract, authors, journal, keywords, publishedYear } = req.body;

  if (!title || !doi || !paperLink || !abstract || !publishedYear) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const duplicate = await Paper.findOne({ $or: [{ doi }, { paperLink }] });
  if (duplicate) {
    return res.status(409).json({
      message: 'A paper with this DOI or link already exists',
      duplicatePaperId: duplicate._id,
    });
  }

  const paper = await Paper.create({
    title,
    doi,
    paperLink,
    abstract,
    authors: normalizeStringList(authors),
    journal,
    keywords: normalizeKeywords(keywords),
    publishedYear,
    requestedBy: req.user._id,
  });

  res.status(201).json({ paper });
}

export async function getMyPapers(req, res) {
  const papers = await Paper.find({ requestedBy: req.user._id }).sort({ createdAt: -1 });
  res.json({ papers });
}

export async function getAllPapers(req, res) {
  const { status, search } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { doi: { $regex: search, $options: 'i' } },
      { paperLink: { $regex: search, $options: 'i' } },
    ];
  }

  const papers = await Paper.find(filter)
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName email')
    .sort({ createdAt: -1 });

  res.json({ papers });
}

export async function getPaperById(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id)
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName email');

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  if (req.user.role !== 'admin' && paper.requestedBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You do not have permission to view this paper' });
  }

  res.json({ paper });
}

export async function updatePaperStatus(req, res) {
  const { status } = req.body;

  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const paper = await Paper.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ paper });
}

export async function updatePaper(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const allowedFields = [
    'title',
    'doi',
    'paperLink',
    'abstract',
    'authors',
    'journal',
    'keywords',
    'publishedYear',
    'status',
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields provided' });
  }

  if (updates.keywords !== undefined) {
    updates.keywords = normalizeKeywords(updates.keywords);
  }

  if (updates.authors !== undefined) {
    updates.authors = normalizeStringList(updates.authors);
  }

  if (updates.publishedYear !== undefined) {
    const publishedYear = Number(updates.publishedYear);

    if (!Number.isInteger(publishedYear) || publishedYear < 1900 || publishedYear > 2100) {
      return res.status(400).json({ message: 'Invalid published year' });
    }

    updates.publishedYear = publishedYear;
  }

  if (updates.status !== undefined && !allowedStatuses.includes(updates.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  if (updates.doi || updates.paperLink) {
    const duplicateFilters = [];

    if (updates.doi) duplicateFilters.push({ doi: updates.doi });
    if (updates.paperLink) duplicateFilters.push({ paperLink: updates.paperLink });

    const duplicate = await Paper.findOne({
      _id: { $ne: req.params.id },
      $or: duplicateFilters,
    });

    if (duplicate) {
      return res.status(409).json({
        message: 'A paper with this DOI or link already exists',
        duplicatePaperId: duplicate._id,
      });
    }
  }

  const paper = await Paper.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName email');

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ paper });
}

export async function deletePaper(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findByIdAndDelete(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ message: 'Paper deleted successfully', paperId: paper._id });
}

export async function uploadPaperPdf(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required' });
  }

  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      pdfPath: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      status: 'downloaded',
    },
    { new: true }
  );

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  res.json({ paper });
}
