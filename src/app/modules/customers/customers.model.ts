import { Schema, model } from "mongoose";
import { ICustomers } from "./customers.interface";

const CustomersSchema = new Schema<ICustomers>(
  {
    uid: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    fullAddress: {
      type: String,
      required: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const Customers = model<ICustomers>("Customers", CustomersSchema);
