import mongoose, { Document } from "mongoose";

export type TWarrantyData = {
  order_id: mongoose.Types.ObjectId;
  orderId: string;
  productId: mongoose.Types.ObjectId;
  endsDate?: Date;
  warrantyCodes: string[];
};

export type TWarranty = TWarrantyData & Document;
