import { Schema, model } from "mongoose";
import { paymentMethodEnum } from "./orderPayment.const";
import { TPayment } from "./orderPayment.interface";

const PaymentSchema = new Schema<TPayment>({
  orderId: {
    type: String,
    required: true,
    immutable: true,
    unique: true,
  },
  paymentMethod: {
    type: String,
    enum: paymentMethodEnum,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  transactionId: {
    type: String,
  },
});

export const OrderPayment = model<TPayment>("OrderPayment", PaymentSchema);
