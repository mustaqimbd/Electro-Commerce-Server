import { NextFunction, Request, Response } from "express";

const enableCrossOriginResourcePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

export default enableCrossOriginResourcePolicy;
