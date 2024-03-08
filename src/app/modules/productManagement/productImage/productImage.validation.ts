import { z } from "zod";

const productImage = z.object({
  thumbnail: z.string().min(1, { message: "Thumbnail image is required!" }),
  gallery: z.array(
    z.string().min(1, { message: "Gallery images is required!" })
  ),
});

const updateProductImage = z.object({
  thumbnail: z
    .string()
    .min(1, { message: "Thumbnail image is required!" })
    .optional(),
  gallery: z
    .array(z.string().min(1, { message: "Gallery images is required!" }))
    .optional(),
});

export const ProductImageValidation = {
  productImage,
  updateProductImage,
};
