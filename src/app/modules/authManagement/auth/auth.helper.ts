import { Request } from "express";
import { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../../../config/config";
import { jwtHelper } from "../../../helper/jwt.helper";
import { CartItem } from "../../cartManagement/cartItem/cartItem.model";
import { TUser } from "../../userManagement/user/user.interface";
import { TRefreshTokenData } from "../refreshToken/refreshToken.interface";
import { RefreshToken } from "../refreshToken/refreshToken.model";

const loginUser = async (req: Request, user: Partial<TUser | null>) => {
  const previousSessionId = req.ecSID.id;
  req.ecSID.newId();
  const sessionId = req.ecSID.id;

  const useragent = req.useragent;
  const customerRfExpires = config.token_data
    .customer_refresh_token_expires as string;
  const adminOrStaffRefExpires = config.token_data
    .admin_staff_refresh_token_expires as string;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const previousCartItems = await CartItem.find(
      {
        sessionId: previousSessionId,
      },
      { _id: 1 }
    );
    if (previousCartItems.length) {
      await CartItem.updateMany(
        {
          _id: {
            $in: previousCartItems.map(({ _id }) => _id),
          },
        },
        { $set: { userId: user?._id, sessionId } }
      );
    }

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
        permissions: (user?.role !== "customer"
          ? user?.permissions?.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (item: any) => item.name
            ) || []
          : undefined) as unknown as string[],
        uid: user?.uid as string,
        sessionId,
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
            user?.role === "customer"
              ? customerRfExpires
              : adminOrStaffRefExpires
          ) *
            24 *
            60 *
            60 *
            1000
      ),
    };
    await RefreshToken.create(refreshTokenData);

    await session.commitTransaction();
    await session.endSession();
    return { user, accessToken, refreshToken };
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const authHelpers = { loginUser };
