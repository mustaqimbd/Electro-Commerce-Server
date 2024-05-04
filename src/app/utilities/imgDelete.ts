import { NextFunction, Request } from "express";
import fsEx from "fs-extra";
// import { TUploadedFiles } from "./formDataParse";

const imgDelete = (req: Request, next: NextFunction) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = req.files as any[];
  if (files?.length) {
    files.forEach(async (file) => {
      const folderPath = file?.path?.split("\\").slice(0, -1).join("\\");
      try {
        await fsEx.remove(folderPath);
      } catch (err) {
        return next(err);
      }
    });
  }
};

export default imgDelete;
