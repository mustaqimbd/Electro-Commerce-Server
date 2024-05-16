import { RequestHandler } from "express";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/authManagement/auth/auth.interface";
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
