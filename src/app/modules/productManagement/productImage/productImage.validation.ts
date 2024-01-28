import { z } from "zod";

const imageValidationSchema = z.object({
  src: z.string().min(1, { message: "Thumbnail image is required!" }),
  alt: z.string().optional(),
});

export const productImageValidationSchema = z.object({
  thumbnail: imageValidationSchema,
  gallery: z.array(imageValidationSchema),
});

export const updateProductImageValidationSchema = z.object({
  body: z.object({
    thumbnail: imageValidationSchema,
    gallery: z.array(imageValidationSchema),
  }),
});
