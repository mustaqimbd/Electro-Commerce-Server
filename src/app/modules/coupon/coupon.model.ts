import mongoose, { Schema, model } from "mongoose";
import { couponDiscountType } from "./coupon.const";
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
      unique: true,
    },
    shortDescription: {
      type: String,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: couponDiscountType,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      validate: {
        validator: function (value: number) {
          return value > 0;
        },
        message: "Max discount must be greater than zero(0)",
      },
    },
    maxDiscount: {
      type: Number,
    },
    minimumOrderValue: {
      type: Number,
    },
    startDate: {
      type: Date,
      default: Date.now(),
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: TCoupon, value: Date) {
          return value > (this?.startDate || new Date());
        },
        message: "End date must be after the start date.",
      },
    },
    usageLimit: {
      type: Number,
    },
    usageCount: { type: Number, default: 0 },
    onlyForRegisteredUsers: {
      type: Boolean,
      default: false,
    },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    fixedCategories: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: undefined,
    },
    restrictedCategories: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: undefined,
    },
    fixedProducts: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String }],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true, versionKey: false }
);

export const Coupon = model<TCoupon>("Coupon", CouponSchema);
