import mongoose, { Schema, model } from "mongoose";
import { TCartItem } from "./cartItem.interface";

// const selectedAttributesOnCartSchema = new Schema<TSelectedAttributesOnCart>({
//   name: {
//     type: String,
//   },
//   value: {
//     type: String,
//   },
// });

const CartItemSchema = new Schema<TCartItem>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
    },
    sessionId: {
      type: String,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      immutable: true,
      ref: "Product",
    },
    // attributes: [selectedAttributesOnCartSchema],
    quantity: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const CartItem = model<TCartItem>("CartItem", CartItemSchema);
