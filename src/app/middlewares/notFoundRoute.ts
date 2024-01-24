/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { IErrorMessages } from "../types/error";

export const notFoundRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const message = "Not found";
  const errorMessages: IErrorMessages[] = [
    {
      path: req.originalUrl,
      message,
    },
  ];
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message,
    errorMessages,
  });
};
