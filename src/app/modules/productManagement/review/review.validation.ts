import { z } from "zod";

const review = z.object({
  rating: z.number().min(1, { message: "Rating is required!" }).optional(),
  comment: z.string().min(1, { message: "Comment is required!" }).optional(),
});

export const ReviewValidation = {
  review,
};
