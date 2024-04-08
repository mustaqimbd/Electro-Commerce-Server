import mongoose, { Document } from "mongoose";
import { TSelectedAttributes } from "../../../types/attribute";
import { TProduct } from "../../productManagement/product/product.interface";

export type TSelectedAttributesOnCart = {
  name: string;
  value: string;
};

export type TCartItemData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  product: mongoose.Types.ObjectId | TProduct;
  attributes: TSelectedAttributes[];
  quantity: number;
  expireAt?: Date;
};

export type TCartItem = TCartItemData & Document;
