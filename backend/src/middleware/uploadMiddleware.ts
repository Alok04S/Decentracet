import multer from "multer";
import { Request } from "express";

const storage = multer.memoryStorage();

function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type: Only authentic PDF documents (.pdf) are permitted."));
  }
}

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});
