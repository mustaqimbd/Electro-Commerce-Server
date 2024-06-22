import { Schema, model } from "mongoose";
import { TFakeCustomer } from "./fakeCustomer.interface";

const FakeCustomerSchema = new Schema<TFakeCustomer>(
  {
    ip: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true, versionKey: false }
);

export const FakeCustomer = model<TFakeCustomer>(
  "fakeCustomer",
  FakeCustomerSchema
);
