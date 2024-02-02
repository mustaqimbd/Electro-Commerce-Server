import { z } from "zod";

const attributeSchema = z
  .object({
    name: z.string().optional(),
    value: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.name === undefined && data.value === undefined) ||
      (data.name !== undefined && data.value !== undefined),
    {
      message:
        "Either both name and value should be present, or both should not be present.",
    }
  );

const addToCart = z.object({
  body: z.object({
    product: z.string({ required_error: "Product id is required" }),
    quantity: z.number({ required_error: "Quantity is required" }),
    attributes: z.array(attributeSchema),
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
