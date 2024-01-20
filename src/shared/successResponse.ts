import { Response } from "express";

type IResponseMeta = {
  page: number;
  limit: number;
  total: number;
};

type ISuccessResponse<T> = {
  statusCode: number;
  success?: true;
  message?: string | null;
  meta?: IResponseMeta | null;
  data?: T | null;
};

const successResponse = <T>(res: Response, data: ISuccessResponse<T>) => {
  const responseData: ISuccessResponse<T> = {
    success: true,
    statusCode: data?.statusCode,
    message: data?.message || "Operation success",
    meta: data.meta || null || undefined,
    data: data?.data || null || undefined,
  };

  res.status(data?.statusCode).json(responseData);
};

export default successResponse;
