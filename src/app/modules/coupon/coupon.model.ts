import mongoose, { Schema, model } from "mongoose";
import { TCoupon } from "./coupon.interface";

const CouponSchema = new Schema<TCoupon>({
  name: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: "User",
  },
});

export const Coupon = model<TCoupon>("Coupon", CouponSchema);
