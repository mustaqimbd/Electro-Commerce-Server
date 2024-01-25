import httpStatus from "http-status";
import mongoose from "mongoose";
import { TErrorMessages, TIErrorResponse } from "../types/error";

const handleMongooseCastError = (
  err: mongoose.Error.CastError
): TIErrorResponse => {
  const message = "Invalid id";
  const errorMessages: TErrorMessages[] = [
    {
      path: err.path,
      message,
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message,
    errorMessages,
  };
};

export default handleMongooseCastError;
