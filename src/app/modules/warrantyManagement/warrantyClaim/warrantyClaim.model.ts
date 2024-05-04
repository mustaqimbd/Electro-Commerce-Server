import mongoose, { Schema, model } from "mongoose";
import { ShippingSchema } from "../../orderManagement/shipping/shipping.model";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
} from "./warrantyClaim.const";
import { TWarrantyClaim } from "./warrantyClaim.interface";

const WarrantyCLaimSchema = new Schema<TWarrantyClaim>({
  shipping: ShippingSchema,
  problemInDetails: {
    type: String,
    required: true,
  },
  contactStatus: {
    type: String,
    enum: warrantyClaimedContactStatus,
  },
  videosAndImages: [
    {
      path: {
        type: String,
      },
      fileType: {
        type: String,
      },
    },
  ],
  warrantyClaimReqData: [
    {
      order_id: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
      orderItemId: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
      claimedCodes: {
        type: [String],
        required: true,
      },
    },
  ],
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  result: {
    type: String,
    enum: warrantyClaimedProductCondition,
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
