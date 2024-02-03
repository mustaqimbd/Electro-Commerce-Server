import { Document } from "mongoose";

export type TPaymentMethods = "cod" | "Nagad" | "Rocket" | "Bkash";

export type TPaymentData = {
  orderId: string;
  paymentMethod: TPaymentMethods;
  phoneNumber?: string;
  transactionId?: string;
};

export type TPayment = TPaymentData | Document;
