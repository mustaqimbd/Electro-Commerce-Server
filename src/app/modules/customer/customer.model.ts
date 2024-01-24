import { Schema, model } from "mongoose";
import { TCustomer } from "./customer.interface";

const CustomersSchema = new Schema<TCustomer>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
    },
    fullAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const Customers = model<TCustomer>("Customer", CustomersSchema);
