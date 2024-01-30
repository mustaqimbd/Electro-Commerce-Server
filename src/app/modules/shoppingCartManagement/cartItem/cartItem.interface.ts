import mongoose, { Document } from "mongoose";

export type TSelectedAttributesOnCart = {
  name: string;
  value: string;
};

export type TCartItemData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  product: mongoose.Types.ObjectId;
  attributes: TSelectedAttributesOnCart[];
  quantity: number;
  expireAt?: Date;
};

export type TCartItem = TCartItemData & Document;
