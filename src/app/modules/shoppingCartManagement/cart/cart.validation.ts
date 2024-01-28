import { z } from "zod";

const addToCart = z.object({
  body: z.object({
    productId: z.string({ required_error: "Product id is required" }),
    quantity: z.number({ required_error: "Quantity is required" }),
  }),
});

const updateQuantity = z.object({
  body: z.object({
    cartItemId: z.string({ required_error: "Cart item id is required" }),
    quantity: z.number({ required_error: "Quantity is required" }),
  }),
});

const deleteCartItem = z.object({
  body: z.object({
    itemId: z.string({ required_error: "Item id is required" }),
  }),
});

export const CartValidation = { addToCart, updateQuantity, deleteCartItem };
