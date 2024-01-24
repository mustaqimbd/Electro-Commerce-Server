export type TErrorMessages = {
  path: string;
  message: string;
};

export type TIErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: TErrorMessages[];
};
