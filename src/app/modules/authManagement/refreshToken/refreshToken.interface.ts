import { Document, Types } from "mongoose";

export type TRefreshTokenData = {
  userId: Types.ObjectId;
  token: string;
  deviceData: {
    isMobile: boolean;
    name: string;
    version: string;
    os: string;
  };
  expireAt: Date;
};

export type TRefreshToken = TRefreshTokenData & Document;
