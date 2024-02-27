import mongoose, { Schema, model } from "mongoose";
import { orderStatus } from "../order/order.const";
import {
  TOrderStatusHistory,
  TStatusHistory,
} from "./orderStatusHistory.interface";

const historySchema = new Schema<TStatusHistory>(
  {
    updatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: orderStatus,
    },
  },
  { timestamps: true }
);

const OrderStatusHistorySchema = new Schema<TOrderStatusHistory>({
  orderId: {
    type: String,
  },
  message: {
    type: String,
  },
  refunded: {
    type: Boolean,
    default: false,
  },
  history: [historySchema],
});

export const OrderStatusHistory = model<TOrderStatusHistory>(
  "OrderStatusHistory",
  OrderStatusHistorySchema
);
