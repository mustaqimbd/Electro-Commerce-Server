import mongoose, { Schema, model } from "mongoose";
import { contactStatus } from "./warranty.const";
import { TWarrantyClaim } from "./warrantyClaim.interface";

const WarrantyCLaimSchema = new Schema<TWarrantyClaim>({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  shipping: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipping",
    required: true,
  },
  contactStatus: {
    type: String,
    enum: contactStatus,
  },
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export const WarrantyClaim = model<TWarrantyClaim>(
  "WarrantyClaim",
  WarrantyCLaimSchema
);
