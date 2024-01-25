import { z } from "zod";

export const attributeValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Attribute name is required!" }),
    values: z.array(
      z.string().min(1, { message: "Attribute value is required!" })
    ),
  }),
});

export const updateAttributeValidationSchema = z.object({
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
