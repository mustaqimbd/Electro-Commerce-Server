import httpStatus from "http-status";
import mongoose from "mongoose";
import { TErrorMessages, TIErrorResponse } from "../types/error";

const handleMongooseCastError = (
  err: mongoose.Error.ValidationError
): TIErrorResponse => {
  const message = err.name;
  const errorMessages: TErrorMessages[] = [
    {
      path: "",
      message: err.message,
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message,
    errorMessages,
  };
};

export default handleMongooseCastError;
