import mongoose, { Document } from "mongoose";
import { TOrderedProducts } from "../orderedProducts/orderedProduct.interface";

export type TOrderData = {
  orderId: string;
  orderedProductsDetails: mongoose.Types.ObjectId | TOrderedProducts;
  couponDetails: mongoose.Types.ObjectId;
  subtotal: number;
  tax: number;
  shippingCharge: number;
  discount: number;
  total: number;
  payment: mongoose.Types.ObjectId;
  shipping: mongoose.Types.ObjectId;
};

export type TOrder = TOrderData & Document;
