import httpStatus from "http-status";
import mongoose from "mongoose";
import { IErrorMessages, IErrorResponse } from "../types/error";

const handleMongooseCastError = (
  err: mongoose.Error.CastError
): IErrorResponse => {
  const message = "Invalid id";
  const errorMessages: IErrorMessages[] = [
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
