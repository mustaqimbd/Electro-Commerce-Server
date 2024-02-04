import { CookieOptions, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config/config";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import {
  TJwtPayload,
  TLoginResponse,
  TRefreshTokenResponse,
} from "./auth.interface";
import { AuthServices } from "./auth.service";

const login = catchAsync(async (req: Request, res: Response) => {
  const { ...payload } = req.body;
  const result = await AuthServices.login(req.useragent, payload);
  const { refreshToken, ...others } = result;

  const cookieOption: CookieOptions = {
    secure: config.env === "production",
    httpOnly: true,
  };
  res.cookie("refreshToken", refreshToken, cookieOption);
  successResponse<TLoginResponse>(res, {
    statusCode: httpStatus.OK,
    message: "Logged in successfully",
    data: others,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await AuthServices.refreshToken(refreshToken);
  successResponse<TRefreshTokenResponse>(res, {
    statusCode: httpStatus.OK,
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { ...passwordData } = req.body;
  await AuthServices.changePassword(passwordData, req.user as TJwtPayload);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password changed successfully.",
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  await AuthServices.logoutUser(refreshToken);
  res.cookie("refreshToken", "", { expires: new Date(0) });
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged out successfully.",
  });
});

const getLoggedInDevices = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as TJwtPayload;
  const result = await AuthServices.getLoggedInDevicesFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged in devices retrieved successfully.",
    data: result,
  });
});

export const AuthControllers = {
  login,
  refreshToken,
  changePassword,
  logoutUser,
  getLoggedInDevices,
};
