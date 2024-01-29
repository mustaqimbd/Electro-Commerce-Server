import { z } from "zod";

export const brand = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Brand name is required!" }),
    description: z.string().optional(),
    logo: z.string().optional(),
  }),
});

export const updateBrand = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Brand name is required!" }).optional(),
    description: z.string().optional(),
    logo: z.string().optional(),
  }),
});

export const BrandValidation = {
  brand,
  updateBrand,
};
