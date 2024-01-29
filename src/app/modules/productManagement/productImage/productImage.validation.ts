import { z } from "zod";

const image = z.object({
  src: z.string().min(1, { message: "Thumbnail image is required!" }),
  alt: z.string().optional(),
});

const productImage = z.object({
  thumbnail: image,
  gallery: z.array(image),
});

const updateProductImage = z.object({
  body: z.object({
    thumbnail: image,
    gallery: z.array(image),
  }),
});

export const ProductImageValidation = {
  productImage,
  updateProductImage,
};
