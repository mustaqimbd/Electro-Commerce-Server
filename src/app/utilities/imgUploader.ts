import multer from "multer";
import path from "path";
import ApiError from "../errorHandlers/ApiError";
import httpStatus from "http-status";
import config from "../config/config";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadFolder());
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

const getUploadFolder = () => {
  // Create a unique folder name using a timestamp
  const timestamp = Date.now();
  const uploadFolder = path.join("uploads/public", String(timestamp));
  // const uploadFolder = process.cwd() + "/uploads/public/" + String(timestamp);

  // Create the folder if it doesn't exist
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  return uploadFolder;
};

const imgUploader = multer({
  storage: storage,
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

export default imgUploader;
