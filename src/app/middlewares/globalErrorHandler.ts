import { ErrorRequestHandler } from "express";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import { IErrorMessages } from "../../types/error";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorhandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message =
    "Something went wrong. Please try again later or contact to the support";
  let errorMessages: IErrorMessages[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessages = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env === "development" ? err.stack : undefined,
  });
};

export default globalErrorhandler;
