import httpStatus from "http-status";
import { TErrorMessages, TIErrorResponse } from "../types/error";

const handleBSONError = (): TIErrorResponse => {
  const message = "Please provide a valid ID";
  const errorMessages: TErrorMessages[] = [
    {
      path: "",
      message,
    },
  ];

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Invalid ID",
    errorMessages,
  };
};

export default handleBSONError;
