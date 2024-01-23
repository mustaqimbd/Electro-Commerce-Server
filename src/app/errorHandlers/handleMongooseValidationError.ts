import httpStatus from "http-status";
import mongoose from "mongoose";
import { IErrorMessages, IErrorResponse } from "../types/error";

const handleMongooseValidationError = (
  error: mongoose.Error.ValidationError,
): IErrorResponse => {
  const errorMessages: IErrorMessages[] = Object.values(error.errors).map(
    (
      singleError: mongoose.Error.ValidatorError | mongoose.Error.CastError,
    ) => ({
      path: singleError.path,
      message: singleError.message.split("`").join(""),
    }),
  );

  const modifiedError: IErrorResponse = {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Validation error",
    errorMessages,
  };
  return modifiedError;
};

export default handleMongooseValidationError;
