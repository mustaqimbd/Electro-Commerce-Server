import httpStatus from "http-status";
import { ZodError, ZodIssue } from "zod";
import { IErrorMessages, IErrorResponse } from "../types/error";

const handleJodError = (err: ZodError): IErrorResponse => {
  const errorMessages: IErrorMessages[] = err.issues.map((issue: ZodIssue) => ({
    path: `${issue?.path[issue?.path.length - 1]}`,
    message: issue?.message,
  }));

  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Validation error",
    errorMessages,
  };
};

export default handleJodError;
