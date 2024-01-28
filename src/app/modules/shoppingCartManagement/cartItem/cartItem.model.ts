import mongoose, { Schema, model } from "mongoose";
import { TCartItem } from "./cartItem.interface";

const CartItemSchema = new Schema<TCartItem>({
  userId: {
    type: mongoose.Schema.ObjectId,
    immutable: true,
  },
  sessionId: {
    type: String,
    immutable: true,
  },
  product: {
    type: mongoose.Schema.ObjectId,
    immutable: true,
    // ref:"product" // TODO: Enable ref
  },
  quantity: {
    type: Number,
  },
});

export const CartItem = model<TCartItem>("Cart_item", CartItemSchema);
