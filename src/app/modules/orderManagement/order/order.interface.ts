import mongoose, { Document } from "mongoose";
import { TUser } from "../../userManagement/user/user.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrderedProducts } from "../orderedProducts/orderedProducts.interface";

export type TOrderStatus =
  | "pending"
  | "processing"
  | "On courier"
  | "completed"
  | "canceled";

export type TOrderData = {
  orderId: string;
  userId: mongoose.Types.ObjectId | TUser;
  sessionId: string;
  orderedProductsDetails: mongoose.Types.ObjectId | TOrderedProducts;
  couponDetails?: mongoose.Types.ObjectId;
  subtotal?: number;
  tax?: number;
  shippingCharge: mongoose.Types.ObjectId;
  discount?: number;
  total: number;
  payment: mongoose.Types.ObjectId;
  status: TOrderStatus;
  statusHistory: mongoose.Types.ObjectId | TOrderStatusHistory;
  shipping: mongoose.Types.ObjectId;
  orderFrom: string;
};

export type TOrder = TOrderData & Document;
