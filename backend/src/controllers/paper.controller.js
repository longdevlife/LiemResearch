import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Paper } from '../models/Paper.js';
import { deletePdfFromS3, getPdfDownloadUrl, isS3Path, uploadPdfToS3 } from '../utils/s3.js';
import { syncUserPoints } from '../utils/points.js';
import {
  notifyAdminsPaperPdfUploaded,
  notifyAdminsPaperSubmitted,
  notifyUsersPaperApproved,
} from '../utils/notification.js';

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

function isApprovedStatus(status) {
  return status === 'downloaded' || status === 'not-downloaded';
}

function normalizePaperUpdateStatus(status, paper) {
  return status === 'approved' ? getApprovalStatus(paper) : normalizePaperStatus(status);
}

function shouldNotifyApproval(previousStatus, nextStatus) {
  return !isApprovedStatus(previousStatus) && isApprovedStatus(nextStatus);
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

function hasEnoughWords(value, minWords) {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .length >= minWords;
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePaperRequest({ title, doi, paperLink, abstract, keywords, publishedYear }) {
  const trimmedTitle = String(title).trim();
  const trimmedDoi = String(doi).trim();
  const trimmedAbstract = String(abstract).trim();
  const publishedYearNumber = Number(publishedYear);
  const maxYear = new Date().getFullYear() + 1;

  if (trimmedTitle.length < 8 || !hasEnoughWords(trimmedTitle, 3)) {
    return 'Please enter a clearer paper title';
  }

  if (!/^10\.\d{4,9}\/\S+$/i.test(trimmedDoi)) {
    return 'Please enter a valid DOI';
  }

  if (!isHttpUrl(paperLink)) {
    return 'Please enter a valid paper link';
  }

  if (trimmedAbstract.length < 40 || !hasEnoughWords(trimmedAbstract, 8)) {
    return 'Please enter a short but meaningful abstract';
  }

  if (keywords.length === 0 || keywords.some((keyword) => keyword.length < 2)) {
    return 'Please enter at least one meaningful keyword';
  }

  if (!Number.isInteger(publishedYearNumber) || publishedYearNumber < 1900 || publishedYearNumber > maxYear) {
    return `Publication year must be between 1900 and ${maxYear}`;
  }

  return '';
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

async function deleteStoredPdf(pdfPath) {
  if (!pdfPath) return;

  if (isS3Path(pdfPath)) {
    await deletePdfFromS3(pdfPath);
    return;
  }

  await removeUploadedFile({ path: resolvePaperPdfPath(pdfPath) });
}

async function storeUploadedPdf(file) {
  if (!file) return '';

  return uploadPdfToS3(file);
}

export async function createPaper(req, res) {
  const { title, doi, paperLink, abstract, authors, journal, keywords, publishedYear } = req.body;
  const normalizedKeywords = normalizeKeywords(keywords);

  if (!title || !doi || !paperLink || !abstract || !publishedYear) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (normalizedKeywords.length === 0) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'At least one keyword is required' });
  }

  const validationError = validatePaperRequest({
    title,
    doi,
    paperLink,
    abstract,
    keywords: normalizedKeywords,
    publishedYear,
  });

  if (validationError) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: validationError });
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

  const uploadedPdfPath = await storeUploadedPdf(req.file);

  const paperData = {
    title: String(title).trim(),
    doi: String(doi).trim(),
    paperLink: String(paperLink).trim(),
    abstract: String(abstract).trim(),
    authors: normalizeStringList(authors),
    journal: journal ? String(journal).trim() : '',
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

  let paper;

  try {
    paper = await Paper.create(paperData);
  } catch (error) {
    await deleteStoredPdf(uploadedPdfPath);
    throw error;
  }

  await syncUserPoints(req.user._id);

  try {
    await notifyAdminsPaperSubmitted({
      paperId: paper._id,
      paperTitle: paper.title,
      requesterName: req.user.fullName,
      actorId: req.user._id,
    });
  } catch (error) {
    console.error('Failed to create admin notification for new paper:', error);
  }

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

export async function getPaperPdfDownloadUrl(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });
  if (!paper.pdfPath) return res.status(404).json({ message: 'PDF is not available for this paper' });

  if (req.user.role !== 'admin' && paper.requestedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You do not have permission to download this PDF' });
  }

  const downloadUrl = await getPdfDownloadUrl(paper.pdfPath, `${paper.doi || paper.title}.pdf`);

  res.json({ downloadUrl });
}

export async function updatePaperStatus(req, res) {
  const { status } = req.body;

  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const currentPaper = await Paper.findById(req.params.id).populate('requestedBy', 'fullName');

  if (!currentPaper) return res.status(404).json({ message: 'Paper not found' });

  const previousStatus = currentPaper.status;
  const nextStatus = normalizePaperUpdateStatus(status, currentPaper);
  const notifyApproval = shouldNotifyApproval(previousStatus, nextStatus);

  const paper = await Paper.findByIdAndUpdate(req.params.id, { status: nextStatus }, { new: true });
  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  await syncUserPoints(paper.requestedBy);
  if (paper.uploadedBy) {
    await syncUserPoints(paper.uploadedBy);
  }

  if (notifyApproval) {
    try {
      await notifyUsersPaperApproved({
        paperId: paper._id,
        paperTitle: paper.title,
        requesterName: currentPaper.requestedBy?.fullName || 'A user',
        actorId: req.user._id,
        excludeUserId: currentPaper.requestedBy?._id,
      });
    } catch (error) {
      console.error('Failed to create user notification for approved paper:', error);
    }
  }

  res.json({ paper });
}

export async function updatePaper(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const existingPaper = await Paper.findById(req.params.id).populate('requestedBy', 'fullName');
  if (!existingPaper) return res.status(404).json({ message: 'Paper not found' });

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
    updates.status = normalizePaperUpdateStatus(updates.status, existingPaper);
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

  const nextStatus = updates.status ?? existingPaper.status;
  const becameApproved = shouldNotifyApproval(existingPaper.status, nextStatus);

  if (becameApproved) {
    try {
      await notifyUsersPaperApproved({
        paperId: paper._id,
        paperTitle: paper.title,
        requesterName: existingPaper.requestedBy?.fullName || 'A user',
        actorId: req.user._id,
        excludeUserId: existingPaper.requestedBy?._id,
      });
    } catch (error) {
      console.error('Failed to create user notification for approved paper:', error);
    }
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

  await deleteStoredPdf(paper.pdfPath);

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

  const uploadedPdfPath = await storeUploadedPdf(req.file);

  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      pdfPath: uploadedPdfPath,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      status: 'pending',
    },
    { new: true }
  );

  if (!paper) {
    await deleteStoredPdf(uploadedPdfPath);
    await removeUploadedFile(req.file);
    return res.status(404).json({ message: 'Paper not found' });
  }

  await syncUserPoints(paper.uploadedBy);

  if (req.user.role === 'user') {
    try {
      await notifyAdminsPaperPdfUploaded({
        paperId: paper._id,
        paperTitle: paper.title,
        uploaderName: req.user.fullName,
        actorId: req.user._id,
      });
    } catch (error) {
      console.error('Failed to create admin notification for PDF upload:', error);
    }
  }

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

  await deleteStoredPdf(paper.pdfPath);

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
