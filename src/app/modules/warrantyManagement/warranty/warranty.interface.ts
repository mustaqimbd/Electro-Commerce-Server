import mongoose, { Document } from "mongoose";
import { TOrder } from "../../orderManagement/order/order.interface";
import { TProduct } from "../../productManagement/product/product.interface";

export type TWarrantyData = {
  order_id: mongoose.Types.ObjectId | TOrder;
  orderId: string;
  productId: mongoose.Types.ObjectId | TProduct;
  endsDate?: Date;
  warrantyCodes: string[];
};

export type TWarranty = TWarrantyData & Document;

export type TWarrantyInfoInput = {
  itemId: mongoose.Types.ObjectId;
  codes: string[];
};
