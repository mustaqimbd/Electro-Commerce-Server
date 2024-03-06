import { z } from "zod";

const category = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
    image: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const CategoryValidation = {
  category,
};
