export type IErrorMessages = {
  path: string;
  message: string;
};

export type IErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IErrorMessages[];
};
