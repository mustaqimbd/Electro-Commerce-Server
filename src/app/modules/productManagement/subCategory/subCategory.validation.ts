import { z } from "zod";

export const subCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Sub category name is required!" }),
    category: z.string().min(1, { message: "Category name is required!" }),
  }),
});

export const updateSubCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Sub category name is required!" }),
  }),
});
