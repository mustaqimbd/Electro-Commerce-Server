import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { jwtHelper } from "../../helper/jwt.helper";
import { User } from "../user/user.model";
import {
  TJwtPayload,
  TLogin,
  TLoginResponse,
  TRefreshTokenResponse,
} from "./auth.interface";

const login = async (payload: TLogin): Promise<TLoginResponse> => {
  const { phoneNumber, password } = payload;

  const isExist = await User.findOne(
    { phoneNumber },
    { password: 1, role: 1, status: 1 },
  );
  if (!isExist || isExist.status === "deleted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  } else if (isExist.status === "banned") {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have been banned.");
  }

  if (!(await User.isPasswordMatch(password, isExist.password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password did not matched");
  }

  const refreshToken = jwtHelper.createToken(
    { id: isExist._id, role: isExist.role },
    config.token_data.refresh_token_secret as Secret,
    isExist.role === "customer"
      ? (config.token_data.customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string),
  );
  const accessToken = jwtHelper.createToken(
    { id: isExist._id, role: isExist.role },
    config.token_data.access_token_secret as Secret,
    config.token_data.access_token_expires as string,
  );

  return {
    refreshToken,
    accessToken,
  };
};

const refreshToken = async (token: string): Promise<TRefreshTokenResponse> => {
  let verifiedToken = null;
  try {
    verifiedToken = jwtHelper.verifyToken<TJwtPayload>(
      token,
      config.token_data.refresh_token_secret as Secret,
    );
  } catch (error) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");
  }
  const { id } = verifiedToken as TJwtPayload;
  const isExist = await User.findById(id);
  if (!isExist || isExist.status === "deleted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  } else if (isExist.status === "banned") {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have been banned.");
  }
  const accessToken = jwtHelper.createToken(
    { id: isExist._id, role: isExist.role },
    config.token_data.refresh_token_secret as Secret,
    isExist.role === "customer"
      ? (config.token_data.customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string),
  );
  return { accessToken };
};

const changePassword = async () => {};

export const AuthServices = {
  login,
  refreshToken,
  changePassword,
};
