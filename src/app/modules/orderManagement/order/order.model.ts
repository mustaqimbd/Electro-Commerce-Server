import mongoose, { Schema, model } from "mongoose";
import { orderSources } from "./order.const";
import { TOrder } from "./order.interface";

const OrderSchema = new Schema<TOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
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
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "ShippingCharge",
    },
    discount: {
      type: Number,
    },
    total: {
      type: Number,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderPayment",
      required: true,
    },
    statusHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderStatusHistory",
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    shipping: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipping",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    orderFrom: {
      type: String,
    },
    orderNotes: {
      type: String,
    },
    officialNotes: {
      type: String,
    },
    invoiceNotes: {
      type: String,
    },
    courierNotes: {
      type: String,
    },
    orderSource: {
      name: {
        type: String,
        enum: orderSources,
      },
      url: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", OrderSchema);
