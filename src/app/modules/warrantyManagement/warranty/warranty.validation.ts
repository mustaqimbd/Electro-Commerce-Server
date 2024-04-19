import { z } from "zod";

const createWarranty = z.object({
  body: z.object({
    order_Id: z.string({ required_error: "Order _id is required" }),
    warrantyInfo: z
      .object(
        {
          itemId: z.string({ required_error: "Item id is required" }),
          codes: z
            .string({ required_error: "Warranty codes is required" })
            .array(),
        },
        { required_error: "Warranty info is required." }
      )
      .array(),
  }),
});

export const ValidateWarranty = { createWarranty };
