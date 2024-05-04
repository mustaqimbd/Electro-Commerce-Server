import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../config/config";
import ApiError from "../errorHandlers/ApiError";
import { jwtHelper } from "../helper/jwt.helper";
import { TJwtPayload } from "../modules/authManagement/auth/auth.interface";
import {
  TPermission,
  TPermissionNames,
} from "../modules/userManagement/permission/permission.interface";
import { TRoles } from "../modules/userManagement/user/user.interface";
import { User } from "../modules/userManagement/user/user.model";

const authGuard =
  ({
    requiredRoles,
    requiredPermission,
  }: {
    requiredRoles: TRoles[];
    requiredPermission?: TPermissionNames;
  }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let token = req?.headers?.authorization;
      if (token) {
        token = token?.split(" ")[1];
      } else {
        token = req?.cookies["accessToken"];
      }
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
      }

      const verifiedUser = jwtHelper.verifyToken<TJwtPayload>(
        token,
        config.token_data.access_token_secret as Secret
      );

      // if (verifiedUser.sessionId !== req.sessionID) {
      //   throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      // }

      if (
        requiredRoles.length &&
        !requiredRoles.includes(verifiedUser?.role as TRoles)
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, "Not valid user");
      }

      // if any staff try to perform any action by their previous token, after deleting or banding them
      if (verifiedUser.role !== "customer") {
        const user = await User.isUserExist({ _id: verifiedUser.id });
        if (user?.role !== verifiedUser.role) {
          throw new ApiError(httpStatus.FORBIDDEN, "Not valid user");
        }
        if (requiredPermission) {
          if (
            !user?.permissions.some(
              (item) => (item as TPermission).name === requiredPermission
            )
          ) {
            throw new ApiError(
              httpStatus.FORBIDDEN,
              "You don't have permission"
            );
          }
        }
      }

      req.user = verifiedUser;
      next();
    } catch (error) {
      next(error);
    }
  };

export default authGuard;
