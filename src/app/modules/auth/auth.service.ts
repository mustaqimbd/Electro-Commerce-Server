import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config/config";
import ApiError from "../../errorHandlers/ApiError";
import { jwtHelper } from "../../helper/jwt.helper";
import { User } from "../user/user.model";
import { ILogin, ILoginResponse } from "./auth.interface";

const login = async (payload: ILogin): Promise<ILoginResponse> => {
  const { phoneNumber, password } = payload;

  const isExist = await User.findOne({ phoneNumber }, { password: 1, role: 1 });
  if (!isExist || isExist.status === "deleted") {
    throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
  }

  if (isExist.status === "banned") {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have been banned.");
  }

  if (!(await User.isPasswordMatch(password, isExist.password))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password did not matched");
  }

  const refreshToken = jwtHelper.createToken(
    { id: isExist._id, role: isExist.role },
    config.token_data.refresh_token_secret as Secret,
    isExist.role === "customer"
      ? (config.token_data.Customer_refresh_token_expires as string)
      : (config.token_data.admin_staff_refresh_token_expires as string),
  );
  const accessToken = jwtHelper.createToken(
    { id: isExist._id, role: isExist.role },
    config.token_data.access_token_secret as Secret,
    config.token_data.access_token_expires as string,
  );

  return {
    refreshToken,
    accessToken,
  };
};

export const AUthService = {
  login,
};
