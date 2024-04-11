import mongoose, { Document } from "mongoose";
import { TSelectedAttributes } from "../../../types/attribute";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { TPrice } from "../../productManagement/price/price.interface";
import { TProduct } from "../../productManagement/product/product.interface";
import { TUser } from "../../userManagement/user/user.interface";
import { TWarranty } from "../../warrantyManagement/warrenty/warranty.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrderedProducts } from "../orderedProducts/orderedProducts.interface";
import { TShipping } from "../shipping/shipping.interface";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";

export type TOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "On courier"
  | "picked by courier"
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
  lpNo?: string;
};

export type TProductDetails = {
  product: mongoose.Types.ObjectId | TProduct;
  attributes?: TSelectedAttributes[];
  unitPrice: number;
  quantity: number;
  total: number;
  warranty: mongoose.Types.ObjectId | TWarranty;
} & Document;

export type TOrderData = {
  orderId: string;
  userId: mongoose.Types.ObjectId | TUser;
  sessionId: string;
  orderedProductsDetails: mongoose.Types.ObjectId | TOrderedProducts;
  productDetails: TProductDetails[];
  couponDetails?: mongoose.Types.ObjectId;
  subtotal?: number;
  tax?: number;
  shippingCharge: mongoose.Types.ObjectId | TShippingCharge;
  discount?: number;
  advance?: number;
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

export type TSanitizedOrProduct = {
  product: {
    _id: mongoose.Types.ObjectId;
    price: TPrice;
    inventory: TInventory;
    isDeleted: boolean;
  };
  quantity: number;
  attributes?: TSelectedAttributes[];
};
