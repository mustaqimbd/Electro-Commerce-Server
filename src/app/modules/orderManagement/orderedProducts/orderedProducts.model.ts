import mongoose, { Schema, model } from "mongoose";
import { TOrderedProducts, TProductDetails } from "./orderedProducts.interface";

const productDetails = new Schema<TProductDetails>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
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
  // attributes: [
  //   {
  //     name: {
  //       type: String,
  //     },
  //     value: {
  //       type: String,
  //     },
  //   },
  // ],
});

const OrderedProductSchema = new Schema<TOrderedProducts>({
  orderId: {
    type: String,
    required: true,
    immutable: true,
  },
  productDetails: [productDetails],
});

export const OrderedProducts = model<TOrderedProducts>(
  "OrderedProduct",
  OrderedProductSchema
);
