import mongoose, { Schema, model } from "mongoose";
import { TCart } from "./cart.interface";

const CartSchema = new Schema<TCart>({
  userId: {
    //user's _id
    type: mongoose.Schema.Types.ObjectId,
  },
  sessionId: {
    type: String,
    immutable: true,
  },
  cartItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart_item",
    },
  ],
});

export const Cart = model<TCart>("cart", CartSchema);
