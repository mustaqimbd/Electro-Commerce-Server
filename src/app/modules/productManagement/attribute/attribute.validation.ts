import { z } from "zod";

export const attribute = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Attribute name is required!" }),
    values: z.array(
      z.string().min(1, { message: "Attribute value is required!" })
    ),
  }),
});

export const updateAttribute = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: "Attribute name is required!" })
      .optional(),
    values: z
      .array(z.string().min(1, { message: "Attribute value is required!" }))
      .optional(),
    deleteValue: z.string().optional(),
  }),
});

export const AttributeValidation = {
  attribute,
  updateAttribute,
};
