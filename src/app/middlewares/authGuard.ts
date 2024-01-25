import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/auth/auth.interface";
import { User } from "../modules/user/user.model";

const authGuard =
  (...requiredRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
      }

      const verifiedUser = jwtHelper.verifyToken<TJwtPayload>(
        token,
        config.token_data.access_token_secret as Secret
      );

      // if any staff try to perform any action by their previous token, after deleting or banding them
      if (verifiedUser.role !== "customer") {
        const user = await User.isUserExist({ _id: verifiedUser.id });
        if (user?.role !== verifiedUser.role) {
          throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
        }
      }

      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }

      req.user = verifiedUser;
      next();
    } catch (error) {
      next(error);
    }
  };

export default authGuard;
