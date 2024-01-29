import multer from "multer";
import path from "path";
import ApiError from "../errorHandlers/ApiError";
import httpStatus from "http-status";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.cwd() + "/uploads/public");
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const filename =
      file.originalname
        .replace(fileExt, "")
        .toLowerCase()
        .split(" ")
        .join("-") +
      "-" +
      Date.now();
    cb(null, filename + fileExt);
  },
});

const imgUploader = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname);
    const allowedExts = [".jpg", ".jpeg", ".png"];
    if (!allowedExts.includes(ext)) {
      return cb(
        new ApiError(
          httpStatus.BAD_REQUEST,
          "Only jpg, png,jpeg format is allowed"
        )
      );
    }
    cb(null, true);
  },
});

export default imgUploader;
