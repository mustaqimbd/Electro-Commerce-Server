import mongoose from "mongoose";
import { TCartItem } from "../cartItem/cartItem.interface";

export type TCartItems = {
  item: mongoose.Types.ObjectId | TCartItem;
  expireAt?: Date;
};

export type TCartData = {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  cartItems: TCartItems[];
};

export type TCart = TCartData & Document;
