import mongoose, { Document } from "mongoose";

export type TCouponData = {
  name: string;
  slug: string;
  shortDescription: string;
  code: string;
  percentage: number;
  endDate: Date;
  maxDiscountAmount: number;
  limitDiscountAmount: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
};

export type TCoupon = TCouponData & Document;
