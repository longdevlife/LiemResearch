import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Paper } from '../models/Paper.js';
import { syncUserPoints } from '../utils/points.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const allowedStatuses = ['pending', 'approved', 'rejected', 'downloaded', 'not-downloaded'];

function normalizePaperStatus(status) {
  return status === 'approved' ? 'not-downloaded' : status;
}

function getApprovalStatus(paper) {
  return paper.pdfPath ? 'downloaded' : 'not-downloaded';
}

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

function getResetStatus(status) {
  return status === 'pending' ? 'pending' : 'not-downloaded';
}

function resolvePaperPdfPath(pdfPath) {
  if (!pdfPath) return '';

  return path.resolve(uploadsDir, path.basename(pdfPath));
}

async function removeUploadedFile(file) {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch {
    // Ignore cleanup failures.
  }
}

export async function createPaper(req, res) {
  const { title, doi, paperLink, abstract, authors, journal, keywords, publishedYear } = req.body;
  const normalizedKeywords = normalizeKeywords(keywords);
  const uploadedPdfPath = req.file ? `/uploads/${req.file.filename}` : '';

  if (!title || !doi || !paperLink || !abstract || !publishedYear) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (normalizedKeywords.length === 0) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'At least one keyword is required' });
  }

  const publishedYearNumber = Number(publishedYear);

  if (!Number.isInteger(publishedYearNumber) || publishedYearNumber < 1900 || publishedYearNumber > 2100) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'Invalid published year' });
  }

  const duplicate = await Paper.findOne({ $or: [{ doi }, { paperLink }] });
  if (duplicate) {
    await removeUploadedFile(req.file);
    return res.status(409).json({
      message: 'A paper with this DOI or link already exists',
      duplicatePaperId: duplicate._id,
    });
  }

  const paperData = {
    title,
    doi,
    paperLink,
    abstract,
    authors: normalizeStringList(authors),
    journal,
    keywords: normalizedKeywords,
    publishedYear: publishedYearNumber,
    requestedBy: req.user._id,
  };

  if (uploadedPdfPath) {
    paperData.pdfPath = uploadedPdfPath;
    paperData.uploadedBy = req.user._id;
    paperData.uploadedAt = new Date();
    paperData.status = 'pending';
  }

  const paper = await Paper.create(paperData);

  await syncUserPoints(req.user._id);

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
    .populate('uploadedBy', 'fullName university email')
    .sort({ createdAt: -1 });

  res.json({ papers });
}

export async function getPaperById(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id)
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName university email');

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

  const currentPaper = await Paper.findById(req.params.id);

  if (!currentPaper) return res.status(404).json({ message: 'Paper not found' });

  const nextStatus = status === 'approved' ? getApprovalStatus(currentPaper) : normalizePaperStatus(status);

  const paper = await Paper.findByIdAndUpdate(req.params.id, { status: nextStatus }, { new: true });
  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  await syncUserPoints(paper.requestedBy);
  if (paper.uploadedBy) {
    await syncUserPoints(paper.uploadedBy);
  }

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

  if (updates.status !== undefined) {
    const currentPaper = await Paper.findById(req.params.id);

    if (!currentPaper) return res.status(404).json({ message: 'Paper not found' });

    updates.status = updates.status === 'approved' ? getApprovalStatus(currentPaper) : normalizePaperStatus(updates.status);
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
    .populate('uploadedBy', 'fullName university email');

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  await syncUserPoints(paper.requestedBy);
  if (paper.uploadedBy) {
    await syncUserPoints(paper.uploadedBy);
  }

  res.json({ paper });
}

export async function deletePaper(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findByIdAndDelete(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  await syncUserPoints(paper.requestedBy);
  if (paper.uploadedBy) {
    await syncUserPoints(paper.uploadedBy);
  }

  await removeUploadedFile(paper.pdfPath ? { path: resolvePaperPdfPath(paper.pdfPath) } : null);

  res.json({ message: 'Paper deleted successfully', paperId: paper._id });
}

export async function uploadPaperPdf(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required' });
  }

  const existingPaper = await Paper.findById(req.params.id);

  if (!existingPaper) {
    await removeUploadedFile(req.file);
    return res.status(404).json({ message: 'Paper not found' });
  }

  if (existingPaper.pdfPath) {
    await removeUploadedFile(req.file);
    return res.status(409).json({ message: 'This paper already has a PDF uploaded' });
  }

  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      pdfPath: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      status: 'pending',
    },
    { new: true }
  );

  if (!paper) {
    await removeUploadedFile(req.file);
    return res.status(404).json({ message: 'Paper not found' });
  }

  await syncUserPoints(paper.uploadedBy);

  res.json({ paper });
}

export async function deletePaperPdf(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  if (!paper.pdfPath) {
    return res.status(400).json({ message: 'Paper does not have a PDF to delete' });
  }

  await removeUploadedFile({ path: resolvePaperPdfPath(paper.pdfPath) });

  const updatedPaper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      $unset: { pdfPath: '', uploadedBy: '', uploadedAt: '' },
      status: getResetStatus(paper.status),
    },
    { new: true }
  )
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName university email');

  if (!updatedPaper) return res.status(404).json({ message: 'Paper not found' });

  if (paper.uploadedBy) {
    await syncUserPoints(paper.uploadedBy);
  }

  res.json({ paper: updatedPaper });
}
