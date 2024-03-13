import { RequestHandler } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/authManagement/auth/auth.interface";
import { RefreshToken } from "../modules/authManagement/refreshToken/refreshToken.model";
import { User } from "../modules/userManagement/user/user.model";

const optionalAuthGuard: RequestHandler = async (req, res, next) => {
  try {
    let token = req.headers.authorization;
    let userInfo = undefined;
    token = token?.split(" ")[1];
    if (token) {
      const verifiedUser = jwtHelper.verifyToken<TJwtPayload>(
        token,
        config.token_data.access_token_secret as Secret
      );
      await User.isUserExist({ _id: verifiedUser.id });
      userInfo = { isAuthenticated: true, ...verifiedUser };
      if (verifiedUser.sessionId !== req.sessionID) {
        await RefreshToken.deleteOne({ token });
        res.cookie("refreshToken", "", { expires: new Date(0) });
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }
    } else {
      userInfo = {
        isAuthenticated: false,
        sessionId: req.sessionID,
      };
    }
    req.user = userInfo;
    next();
  } catch (error) {
    next(error);
  }
};

export default optionalAuthGuard;
