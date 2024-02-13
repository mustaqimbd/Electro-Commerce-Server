import { Schema, model } from "mongoose";
import { TCustomer } from "./customer.interface";

const CustomerSchema = new Schema<TCustomer>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = model<TCustomer>("Customer", CustomerSchema);
