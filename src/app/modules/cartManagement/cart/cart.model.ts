import mongoose, { Schema, model } from "mongoose";
import { TCart, TCartItems } from "./cart.interface";

const cartItemsSchema = new Schema<TCartItems>({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CartItem",
    required: true,
  },
});

const CartSchema = new Schema<TCart>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      immutable: true,
    },
    sessionId: {
      type: String,
      immutable: true,
    },
    cartItems: [cartItemsSchema],
  },
  {
    timestamps: true,
  }
);

export const Cart = model<TCart>("cart", CartSchema);
