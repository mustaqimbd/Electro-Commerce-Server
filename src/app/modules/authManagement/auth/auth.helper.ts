import { Request } from "express";
import { Secret } from "jsonwebtoken";
import mongoose from "mongoose";
import config from "../../../config/config";
import { jwtHelper } from "../../../helper/jwt.helper";
import { TCartData } from "../../shoppingCartManagement/cart/cart.interface";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { TUser } from "../../userManagement/user/user.interface";
import { TRefreshTokenData } from "../refreshToken/refreshToken.interface";
import { RefreshToken } from "../refreshToken/refreshToken.model";

const loginUser = async (req: Request, user: Partial<TUser | null>) => {
  const previousSessionId = req.sessionID;
  let sessionId = req.sessionID;
  await new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (!err) {
        sessionId = req.sessionID;
        resolve(() => {});
      } else {
        reject(err);
      }
    });
  });

  const useragent = req.useragent;
  const customerRfExpires = config.token_data
    .customer_refresh_token_expires as string;
  const adminOrStaffRefExpires = config.token_data
    .admin_staff_refresh_token_expires as string;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const previousCartItems = await CartItem.find({
      sessionId: previousSessionId,
    });
    if (previousCartItems.length) {
      const afterLoginPreviousCarts = await Cart.findOne({
        userId: user?._id,
      }).session(session);

      const cartItems = previousCartItems.map((item) => {
        return {
          item: item._id,
        };
      });
      if (afterLoginPreviousCarts) {
        afterLoginPreviousCarts?.cartItems.push(...cartItems);
        await afterLoginPreviousCarts?.save({ session });
      } else {
        const newCartData: TCartData = {
          userId: user?._id,
          cartItems,
        };
        await Cart.create([newCartData], { session });
      }
      await Cart.deleteOne({ sessionId: previousSessionId }).session(session);

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
