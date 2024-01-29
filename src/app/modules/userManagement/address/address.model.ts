import mongoose, { Schema, model } from "mongoose";
import { TAddress } from "./address.interface";

const AddressSchema = new Schema<TAddress>(
  {
    uid: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    fullAddress: {
      type: String,
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

export const Address = model<TAddress>("Address", AddressSchema);
