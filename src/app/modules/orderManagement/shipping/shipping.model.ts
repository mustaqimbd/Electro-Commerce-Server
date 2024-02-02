import mongoose, { Schema, model } from "mongoose";
import { TShippingData } from "./shipping.interface";

const ShippingSchema = new Schema<TShippingData>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullAddress: {
      type: String,
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
  },
  { timestamps: true }
);

export const Shipping = model<TShippingData>("Shipping", ShippingSchema);
