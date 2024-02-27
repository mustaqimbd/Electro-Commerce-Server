import { Document, Types } from "mongoose";
import { TPaymentMethod } from "../../paymentMethod/paymentMethod.interface";

export type TPaymentData = {
  orderId: string;
  paymentMethod: Types.ObjectId | TPaymentMethod;
  phoneNumber?: string;
  transactionId?: string;
};

export type TPayment = TPaymentData | Document;
