import { NextFunction, Request, RequestHandler, Response } from "express";
import imgDelete from "./imgDelete";
const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      imgDelete(req, next);
      next(err);
    });
  };
};

export default catchAsync;
