import mongoose, { Document } from "mongoose";
import { TUser } from "../../userManagement/user/user.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrderedProducts } from "../orderedProducts/orderedProducts.interface";
import { TShipping } from "../shipping/shipping.interface";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";

export type TOrderStatus =
  | "pending"
  | "processing"
  | "On courier"
  | "completed"
  | "canceled"
  | "follow up"
  | "returned"
  | "deleted";

export type TOrderSourceName =
  | "Website"
  | "Landing Page"
  | "App"
  | "Phone Call"
  | "Social Media"
  | "From Office";

export type TOrderSource = {
  name: TOrderSourceName;
  url?: string;
};

export type TOrderData = {
  orderId: string;
  userId: mongoose.Types.ObjectId | TUser;
  sessionId: string;
  orderedProductsDetails: mongoose.Types.ObjectId | TOrderedProducts;
  couponDetails?: mongoose.Types.ObjectId;
  subtotal?: number;
  tax?: number;
  shippingCharge: mongoose.Types.ObjectId | TShippingCharge;
  discount?: number;
  total: number;
  payment: mongoose.Types.ObjectId;
  status: TOrderStatus;
  statusHistory: mongoose.Types.ObjectId | TOrderStatusHistory;
  shipping: mongoose.Types.ObjectId | TShipping;
  isDeleted: boolean;
  orderFrom: string;
  orderNotes?: string;
  officialNotes?: string;
  invoiceNotes?: string;
  courierNotes?: string;
  orderSource: TOrderSource;
};

export type TOrder = TOrderData & Document;
