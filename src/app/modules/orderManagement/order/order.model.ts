import mongoose, { Schema, model } from "mongoose";
import { TOrder } from "./order.interface";

const OrderSchema = new Schema<TOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    orderedProductsDetails: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "OrderedProduct",
    },
    couponDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
    },
    shippingCharge: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    shipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", OrderSchema);
