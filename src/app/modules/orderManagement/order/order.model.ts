import mongoose, { Schema, model } from "mongoose";
import { orderSources, orderStatus } from "./order.const";
import { TOrder, TProductDetails } from "./order.interface";

const ProductDetailsSchema = new Schema<TProductDetails>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  attributes: [
    {
      type: {
        name: {
          type: String,
        },
        value: {
          type: String,
        },
      },
    },
  ],
  unitPrice: {
    type: Number,
    require: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  warranty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warranty",
  },
});

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
    productDetails: [ProductDetailsSchema],
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
      default: 0,
    },
    advance: {
      type: Number,
      default: 0,
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
      enum: orderStatus,
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
      lpNo: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Order = model<TOrder>("Order", OrderSchema);
