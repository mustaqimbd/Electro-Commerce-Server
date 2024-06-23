import mongoose, { Document } from "mongoose";
import { TSelectedAttributes } from "../../../types/attribute";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { TPrice } from "../../productManagement/price/price.interface";
import { TProduct } from "../../productManagement/product/product.interface";
import { TUser } from "../../userManagement/user/user.interface";
import { TWarranty } from "../../warrantyManagement/warranty/warranty.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrderedProducts } from "../orderedProducts/orderedProducts.interface";
import { TShipping } from "../shipping/shipping.interface";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";

export type TOrderStatus =
  | "pending"
  | "confirmed"
  | "follow up"
  | "processing"
  | "warranty processing"
  | "processing done"
  | "warranty added"
  | "On courier"
  | "returned"
  | "partly returned"
  | "completed"
  | "canceled"
  | "deleted";

export type TOrderSourceName =
  | "Website"
  | "Landing Page"
  | "App"
  | "Phone Call"
  | "Social Media"
  | "From Office"
  | "Warranty Claimed";

export type TCourierProviders = "steadfast";

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
  warranty?: mongoose.Types.ObjectId | TWarranty;
} & Document;

export type TCourierDetails = {
  courierProvider: mongoose.Types.ObjectId;
  trackingId: string;
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
  warrantyAmount: number;
  total: number;
  payment: mongoose.Types.ObjectId;
  status: TOrderStatus;
  deliveryStatus: string;
  followUpDate?: string;
  statusHistory: mongoose.Types.ObjectId | TOrderStatusHistory;
  shipping: mongoose.Types.ObjectId | TShipping;
  isDeleted: boolean;
  orderNotes?: string;
  officialNotes?: string;
  invoiceNotes?: string;
  courierNotes?: string;
  reasonNotes?: string;
  courierDetails?: TCourierDetails;
  orderSource: TOrderSource;
  userIp?: string;
};

export type TOrder = TOrderData & Document;

export type TSanitizedOrProduct = {
  product: {
    _id: mongoose.Types.ObjectId;
    title: string;
    price: TPrice;
    inventory: TInventory;
    isDeleted: boolean;
  };
  quantity: number;
  attributes?: TSelectedAttributes[];
};

export type TCourierResponse = {
  invoice: string;
  tracking_code: string;
  status: string;
};
