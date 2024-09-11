import mongoose, { Schema, model } from "mongoose";
import { TCoupon } from "./coupon.interface";

const CouponSchema = new Schema<TCoupon>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
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
      unique: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxDiscountAmount: {
      type: Number,
    },
    limitDiscountAmount: {
      type: Boolean,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const Coupon = model<TCoupon>("Coupon", CouponSchema);
