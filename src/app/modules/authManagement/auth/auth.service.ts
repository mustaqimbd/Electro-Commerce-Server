import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { jwtHelper } from "../../../helper/jwt.helper";
import { errorLogger } from "../../../utilities/logger";
import { User } from "../../userManagement/user/user.model";
import { RefreshToken } from "../refreshToken/refreshToken.model";
import { authHelpers } from "./auth.helper";
import {
  TChangePasswordPayload,
  TJwtPayload,
  TLogin,
  TLoginResponse,
  TRefreshTokenResponse,
} from "./auth.interface";

const login = async (
  req: Request,
  payload: TLogin
): Promise<TLoginResponse> => {
  const { phoneNumber, password } = payload;

  const user = await User.isUserExist({ phoneNumber });

  if (!(await User.isPasswordMatch(password, user?.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password did not matched");
  }

  return await authHelpers.loginUser(req, user);
};

const refreshToken = async (
  ip: string,
  sessionId: string,
  token: string
): Promise<TRefreshTokenResponse> => {
  let verifiedToken = null;
  const isTokenExist = await RefreshToken.findOne({ token });
  if (!isTokenExist) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Un authorized request");
  }

  if (sessionId !== isTokenExist.sessionId || isTokenExist.ip !== ip) {
    await RefreshToken.deleteOne({ token });
    errorLogger.error(
      `Tried to access ${isTokenExist._id} this account, from ${ip} this ip.`
    );
    throw new ApiError(httpStatus.BAD_REQUEST, "Un authorized request");
  }

  try {
    verifiedToken = jwtHelper.verifyToken<TJwtPayload>(
      token,
      config.token_data.refresh_token_secret as Secret
    );
  } catch (error) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
  }

  const { id } = verifiedToken as TJwtPayload;

  const isExist = await User.isUserExist({ _id: id });

  const accessToken = jwtHelper.createToken(
    {
      id: isExist?._id,
      role: isExist?.role as string,
      uid: isExist?.uid as string,
    },
    config.token_data.access_token_secret as Secret,
    isExist?.role === "customer"
      ? (config.token_data.customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string)
  );
  return { accessToken };
};

const changePassword = async (
  payload: TChangePasswordPayload,
  userIno: TJwtPayload
) => {
  const { newPassword, previousPassword } = payload;
  const user = await User.findOne({ _id: userIno.id }).select("+password");
  if (
    user?.password &&
    !(await User.isPasswordMatch(previousPassword, user?.password as string))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Previous password didn't not matched"
    );
  }
  if (user?.password) {
    user.password = newPassword;
  }
  user?.save();
};

const logoutUser = async (token: string) => {
  await RefreshToken.deleteOne({ token });
};

const getLoggedInDevicesFromDB = async (userId: Types.ObjectId) => {
  const result = await RefreshToken.find({ userId }, { deviceData: 1 });
  return result;
};

export const AuthServices = {
  login,
  refreshToken,
  changePassword,
  logoutUser,
  getLoggedInDevicesFromDB,
};
