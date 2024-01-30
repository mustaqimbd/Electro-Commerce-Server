import { number, z } from "zod";

const price = z.object({
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

const updatePrice = z.object({
  regularPrice: z.number().optional(),
  salePrice: z.number().optional(),
  discount: z.number().optional(),
  date: z
    .object({
      start: z.string().min(1, { message: "Start date is required!" }),
      end: z.string().min(1, { message: "End date is required!" }),
    })
    .optional(),
});

export const PriceValidation = {
  price,
  updatePrice,
};
