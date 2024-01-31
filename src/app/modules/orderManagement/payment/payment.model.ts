import { Schema, model } from "mongoose";
import { paymentMethodEnum } from "./payment.const";
import { TPayment } from "./payment.interface";

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

export const Payment = model<TPayment>("Payment", PaymentSchema);
