import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import successResponse from "../../shared/successResponse";
import { ILoginResponse } from "./auth.interface";
import { AUthService } from "./auth.service";

const login = catchAsync(async (req: Request, res: Response) => {
  const { ...payload } = req.body;
  const result = await AUthService.login(payload);
  successResponse<ILoginResponse>(res, {
    statusCode: httpStatus.CREATED,
    message: `Logged in successfully`,
    data: result,
  });
});

export const AuthController = {
  login,
};
