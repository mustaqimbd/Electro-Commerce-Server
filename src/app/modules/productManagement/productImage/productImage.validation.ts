import { z } from "zod";

const image = z.object({
  src: z.string().min(1, { message: "Thumbnail image is required!" }),
  alt: z.string().optional(),
});

const productImage = z.object({
  thumbnail: image,
  gallery: z.array(image),
});

const updateImage = z.object({
  src: z
    .string()
    .min(1, { message: "Thumbnail image is required!" })
    .optional(),
  alt: z.string().optional(),
});

const updateProductImage = z.object({
  thumbnail: updateImage.optional(),
  gallery: z.array(updateImage).optional(),
});

export const ProductImageValidation = {
  productImage,
  updateProductImage,
};
