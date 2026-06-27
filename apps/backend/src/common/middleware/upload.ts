// @ts-ignore
import multer from "multer";
import { AppError } from "../exceptions/app-error.js";

// Use memory storage so we can decide whether to save locally or upload to cloud (S3/etc.) in the controller
const storage = (multer as any).memoryStorage();

export const uploadSinglePdf = (multer as any)({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype !== "application/pdf") {
      return cb(AppError.badRequest("Only PDF files are allowed"));
    }
    cb(null, true);
  },
}).single("pdf");
