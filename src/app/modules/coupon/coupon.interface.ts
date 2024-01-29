import mongoose, { Document } from "mongoose";

export type TCouponData = {
  name: string;
  shortDescription: string;
  code: string;
  percentage: number;
  endDate: Date;
  createdBy: mongoose.Types.ObjectId;
};

export type TCoupon = TCouponData & Document;
