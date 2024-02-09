import { Document, Types } from "mongoose";

export type TPasswordResetOtpData = {
  userId: Types.ObjectId;
  phoneNumber: string;
  requestedIP: string;
  requestedSession: string;
  otp: string;
  expireAt?: Date;
};

export type TPasswordResetOtp = TPasswordResetOtpData & Document;
