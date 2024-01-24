import { z } from "zod";

export const categoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
    parentCategory: z
      .string()
      .min(1, { message: "Parent category name is required!" }),
  }),
});

export const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: "Category name is required!" })
      .optional(),
    parentCategory: z
      .string()
      .min(1, { message: "Parent category name is required!" })
      .optional(),
  }),
});
