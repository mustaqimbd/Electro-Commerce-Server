import httpStatus from "http-status";
import { TErrorMessages, TIErrorResponse } from "../types/error";

const handleMongooseCastError = (): TIErrorResponse => {
  const message = "Invalid id";
  const errorMessages: TErrorMessages[] = [
    {
      path: "",
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
