import mongoose, { Document } from "mongoose";

export type TCartItemData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  product: mongoose.Types.ObjectId;
  quantity: number;
};

export type TCartItem = TCartItemData & Document;
