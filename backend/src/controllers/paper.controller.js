import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { Paper } from '../models/Paper.js';
import { User } from '../models/User.js';
import { deletePdfFromS3, getPdfDownloadUrl, isS3Path, uploadPdfToS3 } from '../utils/s3.js';
import { recordInvalidPdfUpload, syncUserPoints } from '../utils/points.js';
import {
  notifyAdminsPaperPdfUploaded,
  notifyAdminsPaperSubmitted,
  notifyPaperRequesterPdfUploaded,
  notifyUsersPaperApproved,
} from '../utils/notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

const allowedStatuses = ['pending', 'approved', 'rejected', 'downloaded', 'not-downloaded', 'pending-requester-acceptance'];

function normalizePaperStatus(status) {
  return status === 'approved' ? 'not-downloaded' : status;
}

function getApprovalStatus(paper) {
  return paper.pdfPath ? 'downloaded' : 'not-downloaded';
}

function isApprovedStatus(status) {
  return status === 'downloaded' || status === 'not-downloaded' || status === 'pending-requester-acceptance';
}

function getObjectIdValue(value) {
  return value?._id || value;
}

function isPdfWaitingRequesterAcceptance(paper) {
  if (!paper?.pdfPath || !paper.uploadedBy) return false;

  if (paper.status === 'pending-requester-acceptance') return true;

  return paper.status === 'pending' && !isSameObjectId(paper.uploadedBy, paper.requestedBy);
}

function isSameObjectId(left, right) {
  const leftId = getObjectIdValue(left);
  const rightId = getObjectIdValue(right);
  if (!leftId || !rightId) return false;
  return leftId.toString() === rightId.toString();
}

async function normalizeContributorPdfReviewStatus(paper) {
  if (!paper || paper.status !== 'pending' || !paper.pdfPath || !paper.uploadedBy) return paper;
  if (isSameObjectId(paper.uploadedBy, paper.requestedBy)) return paper;

  const uploader = await User.findById(getObjectIdValue(paper.uploadedBy)).select('role');
  if (uploader?.role === 'admin') return paper;

  paper.status = 'pending-requester-acceptance';
  await paper.save();
  return paper;
}

async function normalizeContributorPdfReviewStatuses(papers) {
  return Promise.all(papers.map((paper) => normalizeContributorPdfReviewStatus(paper)));
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

function countWords(value) {
  return String(value)
    .trim()
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word)).length;
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
  const titleWordCount = countWords(trimmedTitle);
  const abstractWordCount = countWords(trimmedAbstract);

  if (trimmedTitle.length < 8 || !hasEnoughWords(trimmedTitle, 3)) {
    return 'Please enter a clearer paper title';
  }

  if (titleWordCount > 200) {
    return 'Paper title must be 200 words or fewer';
  }

  if (!/^10\.\d{4,9}\/\S+$/i.test(trimmedDoi)) {
    return 'Please enter a valid DOI';
  }

  if (!isHttpUrl(paperLink)) {
    return 'Please enter a valid paper link';
  }

  if (String(paperLink).trim().split(/\s+/).length !== 1) {
    return 'Please enter only one paper link for this request';
  }

  if (trimmedAbstract.length < 40 || !hasEnoughWords(trimmedAbstract, 8)) {
    return 'Please enter a short but meaningful abstract';
  }

  if (abstractWordCount > 1000) {
    return 'Abstract must be 1000 words or fewer';
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

  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) {
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = path.basename(String(file.originalname || 'paper.pdf'));
    const localFileName = `${Date.now()}-${safeName}`;
    const localPath = path.resolve(uploadsDir, localFileName);

    await fs.writeFile(localPath, file.buffer);
    return `/uploads/${localFileName}`;
  }

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
  const maxYear = new Date().getFullYear() + 1;

  if (!Number.isInteger(publishedYearNumber) || publishedYearNumber < 1900 || publishedYearNumber > maxYear) {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: `Publication year must be between 1900 and ${maxYear}` });
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
  await normalizeContributorPdfReviewStatuses(papers);
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

  await normalizeContributorPdfReviewStatuses(papers);

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

  await normalizeContributorPdfReviewStatus(paper);

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
    const maxYear = new Date().getFullYear() + 1;

    if (!Number.isInteger(publishedYear) || publishedYear < 1900 || publishedYear > maxYear) {
      return res.status(400).json({ message: `Publication year must be between 1900 and ${maxYear}` });
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

  const requesterId = existingPaper.requestedBy.toString();
  const uploaderId = req.user._id.toString();
  const isRequesterUpload = requesterId === uploaderId;
  const isAdminUpload = req.user.role === 'admin';
  const isApprovedWithoutPdf = existingPaper.status === 'not-downloaded' || existingPaper.status === 'approved';

  if (!isAdminUpload && !isRequesterUpload && !isApprovedWithoutPdf) {
    await removeUploadedFile(req.file);
    return res.status(403).json({ message: 'You can only upload a PDF after the request is approved without a PDF' });
  }

  if (existingPaper.status === 'rejected') {
    await removeUploadedFile(req.file);
    return res.status(400).json({ message: 'Cannot upload a PDF for a rejected paper' });
  }

  const uploadedPdfPath = await storeUploadedPdf(req.file);
  let nextStatus = 'pending-requester-acceptance';

  if (isAdminUpload || isRequesterUpload) {
    nextStatus = isApprovedWithoutPdf ? 'downloaded' : existingPaper.status;
  }

  const paper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      pdfPath: uploadedPdfPath,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      status: nextStatus,
    },
    { new: true }
  ).populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName university email');

  if (!paper) {
    await deleteStoredPdf(uploadedPdfPath);
    await removeUploadedFile(req.file);
    return res.status(404).json({ message: 'Paper not found' });
  }

  await syncUserPoints(paper.uploadedBy);
  if (nextStatus === 'downloaded') {
    await syncUserPoints(paper.requestedBy);
  }

  if (nextStatus === 'pending-requester-acceptance') {
    try {
      await notifyPaperRequesterPdfUploaded({
        paperId: paper._id,
        paperTitle: paper.title,
        uploaderName: req.user.fullName,
        actorId: req.user._id,
        requesterId: paper.requestedBy._id || paper.requestedBy,
      });
    } catch (error) {
      console.error('Failed to create requester notification for PDF upload:', error);
    }
  } else if (req.user.role === 'user') {
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

export async function acceptPaperPdf(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  if (paper.requestedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the requester can accept this PDF' });
  }

  if (!isPdfWaitingRequesterAcceptance(paper)) {
    return res.status(400).json({ message: 'This paper does not have a PDF waiting for requester acceptance' });
  }

  const updatedPaper = await Paper.findByIdAndUpdate(
    req.params.id,
    { status: 'downloaded' },
    { new: true }
  )
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName university email');

  await syncUserPoints(updatedPaper.requestedBy);
  if (updatedPaper.uploadedBy) {
    await syncUserPoints(updatedPaper.uploadedBy);
  }

  res.json({ paper: updatedPaper });
}

export async function rejectPaperPdf(req, res) {
  if (isInvalidPaperId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid paper id' });
  }

  const paper = await Paper.findById(req.params.id);

  if (!paper) return res.status(404).json({ message: 'Paper not found' });

  if (paper.requestedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the requester can reject this PDF' });
  }

  if (!isPdfWaitingRequesterAcceptance(paper)) {
    return res.status(400).json({ message: 'This paper does not have a PDF waiting for requester acceptance' });
  }

  const rejectedUploader = paper.uploadedBy;

  await deleteStoredPdf(paper.pdfPath);

  const updatedPaper = await Paper.findByIdAndUpdate(
    req.params.id,
    {
      $unset: { pdfPath: '', uploadedBy: '', uploadedAt: '' },
      status: 'not-downloaded',
    },
    { new: true }
  )
    .populate('requestedBy', 'fullName email university studentId')
    .populate('uploadedBy', 'fullName university email');

  if (rejectedUploader) {
    await recordInvalidPdfUpload(rejectedUploader);
  }
  await syncUserPoints(updatedPaper.requestedBy);

  res.json({ paper: updatedPaper });
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
