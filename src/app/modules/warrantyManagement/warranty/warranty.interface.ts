import mongoose, { Document } from "mongoose";
import { TOrder } from "../../orderManagement/order/order.interface";
import { TProduct } from "../../productManagement/product/product.interface";

export type TWarrantyData = {
  order_id: mongoose.Types.ObjectId | TOrder;
  orderId: string;
  productId: mongoose.Types.ObjectId | TProduct;
  duration: string;
  startDate: string;
  endsDate: string;
  warrantyCodes: string[];
};

export type TWarranty = TWarrantyData & Document;

export type TWarrantyInfoInput = {
  itemId: mongoose.Types.ObjectId;
  codes: string[];
};
