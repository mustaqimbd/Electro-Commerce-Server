import { z } from "zod";

const image = z.object({
  src: z.string().min(1, { message: "Thumbnail image is required!" }),
  alt: z.string().optional(),
});

const updateImage = z.object({
  src: z
    .string()
    .min(1, { message: "Thumbnail image is required!" })
    .optional(),
  alt: z.string().optional(),
});
export const ImageValidation = {
  image,
  updateImage,
};
