import mongoose, { Document } from "mongoose";

export type TCouponDiscountType = "percentage" | "flat";

export type TCouponData = {
  name: string;
  slug: string;
  shortDescription?: string;
  code: string;
  discountType: TCouponDiscountType;
  discountValue: number;
  maxDiscount?: number; // Limit the coupon amount amount
  minimumOrderValue?: number; // A minium amount of order total
  startDate?: Date; // Coupon start time.
  usageLimit?: number; // How many times coupon can use.
  usageCount?: number; // How many times has the coupon been used?
  onlyForRegisteredUsers?: boolean;
  allowedUsers?: mongoose.Types.ObjectId[];
  fixedCategories?: mongoose.Types.ObjectId[];
  restrictedCategories?: mongoose.Types.ObjectId[];
  fixedProducts?: mongoose.Types.ObjectId[];
  endDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
};

export type TCoupon = TCouponData & Document;
