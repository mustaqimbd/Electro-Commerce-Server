import { NextFunction, Request, RequestHandler, Response } from "express";
import fs from "fs";
const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (req.files) {
        Object.values(req.files).forEach((files) => {
          files.forEach((file: Record<string, unknown>) => {
            const filePath = file.path;
            //delete the file from uploads if error occurs
            fs.unlink(filePath as string, (err) => {
              if (err) {
                return next(err);
              }
            });
          });
        });
      }
      next(err);
    });
  };
};

export default catchAsync;
