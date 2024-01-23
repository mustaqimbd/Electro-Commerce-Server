import { z } from "zod";

export const brandValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Brand name is required!" }),
    description: z.string().optional(),
    logo: z.string().optional(),
  }),
});

export const updateBrandValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Brand name is required!" }),
    description: z.string().optional(),
    logo: z.string().optional(),
  }),
});
