import { z } from "zod";

export const review = z.object({
  product: z.string().min(1, { message: "Product id is required!" }),
  customer: z.string().min(1, { message: "Customer id is required!" }),
  rating: z.number().min(1, { message: "Rating is required!" }).optional(),
  comment: z.string().min(1, { message: "Comment is required!" }).optional(),
});

export const ReviewValidation = {
  review,
};
