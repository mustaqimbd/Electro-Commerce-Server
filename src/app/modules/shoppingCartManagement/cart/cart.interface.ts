import mongoose from "mongoose";
import { TCartItem } from "../cartItem/cartItem.interface";

type TCartItems = mongoose.Types.ObjectId | TCartItem;

export type TCartData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  cartItems: TCartItems[];
};

export type TCart = TCartData & Document;

export type TAddToCartPayload = {
  productId: mongoose.Types.ObjectId; // TODO : Set product model
  quantity: number;
};
