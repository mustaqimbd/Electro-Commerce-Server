import mongoose, { Schema, model } from "mongoose";
import { ShippingSchema } from "../../orderManagement/shipping/shipping.model";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
} from "./warrantyClaim.const";
import { TWarrantyClaim } from "./warrantyClaim.interface";

const WarrantyCLaimSchema = new Schema<TWarrantyClaim>(
  {
    phoneNumber: {
      type: String,
      required: true,
    },
    shipping: ShippingSchema,
    problemInDetails: {
      type: String,
      required: true,
    },
    videosAndImages: {
      type: [
        {
          path: {
            type: String,
          },
          fileType: {
            type: String,
          },
        },
      ],
      required: true,
    },
    warrantyClaimReqData: {
      type: [
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
      required: true,
    },
    officialNotes: {
      type: String,
    },
    contactStatus: {
      type: String,
      enum: warrantyClaimedContactStatus,
      default: "pending",
    },
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
  },
  { timestamps: true }
);

export const WarrantyClaim = model<TWarrantyClaim>(
  "WarrantyClaim",
  WarrantyCLaimSchema
);
