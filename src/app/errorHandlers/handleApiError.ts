import { IErrorResponse } from "../types/error";
import ApiError from "./ApiError";

const handleApiError = (err: ApiError): IErrorResponse => {
  return {
    statusCode: err.statusCode,
    message: err.message,
    errorMessages: [
      {
        path: "",
        message: err.message,
      },
    ],
  };
};

export default handleApiError;
