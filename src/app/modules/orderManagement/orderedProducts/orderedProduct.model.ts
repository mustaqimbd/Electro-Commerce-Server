import mongoose, { Schema, model } from "mongoose";
import { TOrderedProducts, TProductDetails } from "./orderedProduct.interface";

const productDetails = new Schema<TProductDetails>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  attributes: [
    {
      name: {
        type: String,
      },
      value: {
        type: String,
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
});

const OrderedProductSchema = new Schema<TOrderedProducts>({
  orderId: {
    type: String,
    required: true,
    immutable: true,
  },
  productDetails: [productDetails],
});

export const OrdersProduct = model<TOrderedProducts>(
  "OrderedProduct",
  OrderedProductSchema
);
