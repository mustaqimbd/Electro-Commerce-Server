import { z } from "zod";

const subCategory = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Sub category name is required!" }),
    image: z.string().optional(),
    description: z.string().optional(),
    category: z.string().min(1, { message: "Category name is required!" }),
  }),
});

const updateSubCategory = z.object({
  body: z.object({
    name: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const SubCategoryValidation = {
  subCategory,
  updateSubCategory,
};
