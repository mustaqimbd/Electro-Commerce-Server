import mongoose, { Schema, model } from "mongoose";
import { ShippingSchema } from "../../orderManagement/shipping/shipping.model";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
  warrantyClaimedProductLocation,
} from "./warrantyClaim.const";
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
  shipping: ShippingSchema,
  contactStatus: {
    type: String,
    enum: warrantyClaimedContactStatus,
  },
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  result: {
    type: String,
    enum: warrantyClaimedProductCondition,
  },
  productLocation: {
    type: String,
    enum: warrantyClaimedProductLocation,
  },
  approvalStatus: {
    type: String,
    enum: warrantyApprovalStatus,
  },
  finalCheckedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

export const WarrantyClaim = model<TWarrantyClaim>(
  "WarrantyClaim",
  WarrantyCLaimSchema
);
