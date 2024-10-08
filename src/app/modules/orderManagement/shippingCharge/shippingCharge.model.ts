import mongoose, { Schema, model } from "mongoose";
import { TShippingCharge } from "./shippingCharge.interface";

const shippingChargeSchema = new Schema<TShippingCharge>(
  {
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
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
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const ShippingCharge = model<TShippingCharge>(
  "ShippingCharge",
  shippingChargeSchema
);
