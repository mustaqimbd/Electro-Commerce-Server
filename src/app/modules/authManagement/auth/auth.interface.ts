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
  uid: string;
  role: string;
  sessionId: string;
};

export type TRefreshTokenResponse = {
  accessToken: string;
};

export type TChangePasswordPayload = {
  previousPassword: string;
  newPassword: string;
};
