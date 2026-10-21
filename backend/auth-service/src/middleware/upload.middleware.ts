import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { Request, Response, NextFunction } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(__dirname, "../../uploads/avatars");


if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, png, webp, gif, svg) are allowed"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter
});


export function uploadAvatar(req: Request, res: Response, next: NextFunction) {
 
  upload.fields([
    { name: "avatar_image", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
  ])(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "Avatar image size exceeds the 5MB limit"
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process image upload"
      });
    }

  
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      if (files["avatar_image"] && files["avatar_image"].length > 0) {
        req.file = files["avatar_image"][0];
      } else if (files["avatar"] && files["avatar"].length > 0) {
        req.file = files["avatar"][0];
      }
    }

    next();
  });
}

