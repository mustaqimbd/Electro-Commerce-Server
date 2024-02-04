import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import { Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { jwtHelper } from "../../../helper/jwt.helper";
import { User } from "../../userManagement/user/user.model";
import { TRefreshTokenData } from "../refreshToken/refreshToken.interface";
import { RefreshToken } from "../refreshToken/refreshToken.model";
import {
  TChangePasswordPayload,
  TJwtPayload,
  TLogin,
  TLoginResponse,
  TRefreshTokenResponse,
} from "./auth.interface";

const login = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useragent: any,
  payload: TLogin
): Promise<TLoginResponse> => {
  const { phoneNumber, password } = payload;

  const isExist = await User.isUserExist({ phoneNumber });

  if (!(await User.isPasswordMatch(password, isExist?.password as string))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password did not matched");
  }

  const customerRfExpires = config.token_data
    .customer_refresh_token_expires as string;
  const adminOrStaffRefExpires = config.token_data
    .admin_staff_refresh_token_expires as string;

  const refreshToken = jwtHelper.createToken(
    {
      id: isExist?._id,
      role: isExist?.role as string,
      uid: isExist?.uid as string,
    },
    config.token_data.refresh_token_secret as Secret,
    isExist?.role === "customer" ? customerRfExpires : adminOrStaffRefExpires
  );
  const accessToken = jwtHelper.createToken(
    {
      id: isExist?._id,
      role: isExist?.role as string,
      uid: isExist?.uid as string,
    },
    config.token_data.access_token_secret as Secret,
    config.token_data.access_token_expires as string
  );

  const refreshTokenData: TRefreshTokenData = {
    userId: isExist?._id,
    token: refreshToken,
    deviceData: {
      isMobile: useragent.isMobile,
      name: useragent.browser,
      version: useragent.version,
      os: useragent.os,
    },
    expireAt: new Date(
      +new Date() +
        parseInt(
          isExist?.role === "customer"
            ? customerRfExpires
            : adminOrStaffRefExpires
        ) *
          24 *
          60 *
          60 *
          1000
    ),
  };
  if (isExist?.role !== "customer") {
    await RefreshToken.deleteMany({ userId: isExist?._id });
  }
  await RefreshToken.create(refreshTokenData);

  return {
    refreshToken,
    accessToken,
  };
};

const refreshToken = async (token: string): Promise<TRefreshTokenResponse> => {
  let verifiedToken = null;
  const isTokenExist = await RefreshToken.findOne({ token });
  if (!isTokenExist) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Un authorized request");
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
