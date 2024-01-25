import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { jwtHelper } from "../../helper/jwt.helper";
import { User } from "../user/user.model";
import {
  TChangePasswordPayload,
  TJwtPayload,
  TLogin,
  TLoginResponse,
  TRefreshTokenResponse,
} from "./auth.interface";

const login = async (payload: TLogin): Promise<TLoginResponse> => {
  const { phoneNumber, password } = payload;

  const isExist = await User.isUserExist({ phoneNumber });

  if (!(await User.isPasswordMatch(password, isExist?.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password did not matched");
  }

  const refreshToken = jwtHelper.createToken(
    { id: isExist?._id, role: isExist?.role as string },
    config.token_data.refresh_token_secret as Secret,
    isExist?.role === "customer"
      ? (config.token_data.customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string),
  );
  const accessToken = jwtHelper.createToken(
    { id: isExist?._id, role: isExist?.role as string },
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

  const isExist = await User.isUserExist({ _id: id });

  const accessToken = jwtHelper.createToken(
    { id: isExist?._id, role: isExist?.role as string },
    config.token_data.refresh_token_secret as Secret,
    isExist?.role === "customer"
      ? (config.token_data.customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string),
  );
  return { accessToken };
};

const changePassword = async (
  payload: TChangePasswordPayload,
  userIno: TJwtPayload,
) => {
  const { newPassword, previousPassword } = payload;
  const user = await User.findOne({ _id: userIno.id }).select("+password");
  if (
    user?.password &&
    !(await User.isPasswordMatch(previousPassword, user?.password as string))
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Previous password didn't not matched",
    );
  }
  if (user?.password) {
    user.password = newPassword;
  }
  user?.save();
};

export const AuthServices = {
  login,
  refreshToken,
  changePassword,
};
