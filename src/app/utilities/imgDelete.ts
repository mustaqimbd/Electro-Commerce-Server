import { NextFunction, Request } from "express";
// import fs from "fs"; // for file
import fs from "fs-extra";
import { TUploadedFiles } from "./formDataParse";

const imgDelete = (req: Request, next: NextFunction) => {
  const filePaths = req.files as TUploadedFiles;
  if (filePaths) {
    Object.values(filePaths).forEach((files) => {
      files.forEach(async (file) => {
        const filePath = file.path;
        // delete the file from uploads if error occurs after uploading
        // fs.unlink(filePath as string, (err) => {
        //     if (err) {
        //         return next(err);
        //     }
        // });
        // delete the folder with file from uploads
        const folderPath = filePath.split("\\").slice(0, -1).join("\\");
        try {
          await fs.remove(folderPath);
        } catch (err) {
          return next(err);
        }
      });
    });
  }
};

export default imgDelete;
