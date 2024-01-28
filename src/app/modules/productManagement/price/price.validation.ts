import { number, z } from "zod";

export const priceValidationSchema = z.object({
  regularPrice: z.number(),
  salePrice: z.number().optional(),
  discount: number().optional(),
  date: z
    .object({
      start: z.string().min(1, { message: "Start date is required!" }),
      end: z.string().min(1, { message: "End date is required!" }),
    })
    .optional(),
});

export const updatePriceValidationSchema = z.object({
  body: z.object({
    regularPrice: z.number(),
    salePrice: z.number().optional(),
    discount: z.string().optional(),
    date: z
      .object({
        start: z.string().min(1, { message: "Start date is required!" }),
        end: z.string().min(1, { message: "End date is required!" }),
      })
      .optional(),
  }),
});
