import { Schema, model } from "mongoose";
import {
  TPaymentMethod,
  TPaymentMethodMerchantACInfo,
} from "./paymentMethod.interface";

const merchantACInfoSchema = new Schema<TPaymentMethodMerchantACInfo>(
  {
    accountType: {
      type: String,
    },
    accountNo: {
      type: String,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const PaymentMethodSchema = new Schema<TPaymentMethod>(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Image",
    },
    description: {
      type: String,
      required: true,
    },
    merchantACInfo: merchantACInfoSchema,
    isPaymentDetailsNeeded: {
      type: Boolean,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PaymentMethod = model<TPaymentMethod>(
  "PaymentMethod",
  PaymentMethodSchema
);
