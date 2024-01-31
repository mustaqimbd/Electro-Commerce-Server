import mongoose, { Document } from "mongoose";
import { TSelectedAttributes } from "../../../types/attribute";

export type TSelectedAttributesOnCart = {
  name: string;
  value: string;
};

export type TCartItemData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  product: mongoose.Types.ObjectId;
  attributes: TSelectedAttributes[];
  quantity: number;
  expireAt?: Date;
};

export type TCartItem = TCartItemData & Document;
