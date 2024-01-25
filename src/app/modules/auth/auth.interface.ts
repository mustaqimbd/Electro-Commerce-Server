import { Types } from "mongoose";

export type TLogin = {
  phoneNumber: string;
  password: string;
};

export type TLoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type TJwtPayload = {
  id: Types.ObjectId;
  role: string;
};

export type TRefreshTokenResponse = {
  accessToken: string;
};

export type TChangePasswordPayload = {
  previousPassword: string;
  newPassword: string;
};
