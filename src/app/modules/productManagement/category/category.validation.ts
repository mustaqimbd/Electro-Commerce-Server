import { z } from "zod";

const category = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
  }),
});

export const CategoryValidation = {
  category,
};
