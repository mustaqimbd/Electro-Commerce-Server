import mongoose, { Document } from "mongoose";

export type TCartItemData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  product: mongoose.Types.ObjectId;
  quantity: number;
  expireAt?: Date;
};

export type TCartItem = TCartItemData & Document;
