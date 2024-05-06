import { z } from "zod";

const createWarranty = z.object({
  body: z.object({
    order_Id: z.string({ required_error: "Order _id is required" }),
    warrantyInfo: z
      .object(
        {
          itemId: z.string({ required_error: "Item id is required" }),
          codes: z
            .object(
              {
                code: z.string({ required_error: "Code is required" }),
              },
              { required_error: "Codes is required" }
            )
            .array(),
        },
        { required_error: "Warranty info is required." }
      )
      .array(),
  }),
});

export const ValidateWarranty = { createWarranty };
