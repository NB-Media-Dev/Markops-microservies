import multer from "multer";
import type { Request } from "express";

// Use memory storage so the file doesn't clutter your server hard drive
const storage = multer.memoryStorage();

// Filter files to ensure only Excel formats (.xlsx or .xls) are allowed
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel" // .xls
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only Excel files (.xlsx, .xls) are allowed!"));
  }
};

// Create the configured upload instance
export const uploadExcelMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit file size to 5MB maximum
  }
}).single("file"); // Explictly looks for a form field named "file"
