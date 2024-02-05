import { Request } from "express";
import { Secret } from "jsonwebtoken";
import config from "../../../config/config";
import { jwtHelper } from "../../../helper/jwt.helper";
import { TUser } from "../../userManagement/user/user.interface";
import { TRefreshTokenData } from "../refreshToken/refreshToken.interface";
import { RefreshToken } from "../refreshToken/refreshToken.model";

const loginUser = async (req: Request, user: Partial<TUser | null>) => {
  const sessionId = req.sessionID;
  const useragent = req.useragent;
  const customerRfExpires = config.token_data
    .customer_refresh_token_expires as string;
  const adminOrStaffRefExpires = config.token_data
    .admin_staff_refresh_token_expires as string;

  const refreshToken = jwtHelper.createToken(
    {
      id: user?._id,
      role: user?.role as string,
      uid: user?.uid as string,
    },
    config.token_data.refresh_token_secret as Secret,
    user?.role === "customer" ? customerRfExpires : adminOrStaffRefExpires
  );
  const accessToken = jwtHelper.createToken(
    {
      id: user?._id,
      role: user?.role as string,
      uid: user?.uid as string,
    },
    config.token_data.access_token_secret as Secret,
    config.token_data.access_token_expires as string
  );

  if (user?.role !== "customer") {
    await RefreshToken.deleteMany({ userId: user?._id });
  }
  const refreshTokenData: TRefreshTokenData = {
    userId: user?._id,
    token: refreshToken,
    sessionId,
    ip: req.clientIp as string,
    deviceData: {
      isMobile: useragent?.isMobile as boolean,
      name: useragent?.browser as string,
      version: useragent?.version as string,
      os: useragent?.os as string,
    },
    expireAt: new Date(
      +new Date() +
        parseInt(
          user?.role === "customer" ? customerRfExpires : adminOrStaffRefExpires
        ) *
          24 *
          60 *
          60 *
          1000
    ),
  };
  await RefreshToken.create(refreshTokenData);

  return { accessToken, refreshToken };
};

export const authHelpers = { loginUser };
