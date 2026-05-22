import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordInvalidPdfUpload } from '../utils/points.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

export function uploadSinglePdf(req, res, next) {
  uploadPdf.single('pdf')(req, res, async (err) => {
    if (!err) {
      next();
      return;
    }

    if (req.user?._id && err.message === 'Only PDF files are allowed') {
      await recordInvalidPdfUpload(req.user._id);
      res.status(400).json({ message: 'Please upload a valid PDF file' });
      return;
    }

    next(err);
  });
}
