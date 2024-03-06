import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import handleApiError from "../errorHandlers/handleApiError";
import handleJodError from "../errorHandlers/handleJodError";
import handleMongooseCastError from "../errorHandlers/handleMongooseCastError";
import handleMongooseDuplicateError from "../errorHandlers/handleMongooseDuplicateError";
import handleMongooseValidationError from "../errorHandlers/handleMongooseValidationError";
import { TErrorMessages, TIErrorResponse } from "../types/error";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorhandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message =
    "Something went wrong. Please try again later or contact to the support";
  let errorMessages: TErrorMessages[] = [{ path: "", message }];
  if (err.name === "ValidationError") {
    const modifiedError: TIErrorResponse = handleMongooseValidationError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err.name === "CastError") {
    const modifiedError: TIErrorResponse = handleMongooseCastError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err.name === "MongoServerError" && err.code === 11000) {
    const modifiedError: TIErrorResponse = handleMongooseDuplicateError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err instanceof ZodError) {
    const modifiedError: TIErrorResponse = handleJodError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  } else if (err instanceof ApiError) {
    const modifiedError: TIErrorResponse = handleApiError(err);
    message = modifiedError.message;
    statusCode = modifiedError.statusCode;
    errorMessages = modifiedError.errorMessages;
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env === "development" ? err.stack : undefined,
  });
};

export default globalErrorhandler;
