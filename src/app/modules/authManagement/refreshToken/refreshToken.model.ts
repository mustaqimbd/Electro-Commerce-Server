import { Schema, model } from "mongoose";
import { TRefreshToken } from "./refreshToken.interface";

const RefreshTokenSchema = new Schema<TRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      required: true,
    },
    deviceData: {
      isMobile: {
        type: Boolean,
      },
      name: {
        type: String,
      },
      version: {
        type: String,
      },
      os: {
        type: String,
      },
    },
    expireAt: {
      type: Date,
      required: true,
      index: { expires: "200d" },
    },
  },
  {
    timestamps: true,
  }
);

export const RefreshToken = model<TRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);
