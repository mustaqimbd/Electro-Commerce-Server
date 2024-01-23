import { Schema, model } from "mongoose";
import { ICustomers } from "./customers.interface";

const CustomersSchema = new Schema<ICustomers>(
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

export const Customers = model<ICustomers>("Customers", CustomersSchema);
