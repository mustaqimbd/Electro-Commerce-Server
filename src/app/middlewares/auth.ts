import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/auth/auth.interface";

const auth =
  (...requiredRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
      }
      const verifiedUser = jwtHelper.verifyToken<TJwtPayload>(
        token,
        config.token_data.access_token_secret as Secret
      );
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }
      req.user = verifiedUser;
      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
