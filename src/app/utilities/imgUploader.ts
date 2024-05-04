import fs from "fs";
import httpStatus from "http-status";
import multer from "multer";
import path from "path";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";

const storage = (dirName: string) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, getUploadFolder(dirName));
    },
    filename: function (req, file, cb) {
      const fileExt = path.extname(file.originalname);
      const filename = file.originalname
        .replace(fileExt, "")
        .toLowerCase()
        .split(" ")
        .join("-");
      // +  "-" + Date.now();
      cb(null, filename + fileExt);
    },
  });

const getUploadFolder = (dirName: string) => {
  // Create a unique folder name using a timestamp
  const timestamp = Date.now();
  const uploadFolder = path.join(`uploads/${dirName}`, String(timestamp));
  // const uploadFolder = process.cwd() + "/uploads/public/" + String(timestamp);

  // Create the folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  return uploadFolder;
};

const imgUploader = multer({
  storage: storage("public"),
  limits: { fileSize: Number(config.upload_image_size) }, // 1MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    const allowedExts = JSON.parse(config.upload_image_format as string);
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${allowedExts} format is allowed`
        )
      );
    }
    cb(null, true);
  },
});

export const imageAndVideoUploader = multer({
  storage: storage("warranty"),
  limits: { fileSize: Number(config.upload_image_size) }, // 1MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    const allowedExts = [
      ...JSON.parse(config.upload_image_format as string),
      ".mp4",
      ".mov",
      ".avi",
    ];
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${allowedExts} format is allowed`
        )
      );
    }
    cb(null, true);
  },
});

export default imgUploader;
