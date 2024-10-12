import { z } from "zod";
import { shippingValidationZodSchema } from "../orderManagement/shipping/shipping.validation";

const createReq = z.object({
  body: z.object({
    shipping: shippingValidationZodSchema(true),
    customerNotes: z.string().optional(),
  }),
});

export const ImageToOrderValidate = {
  createReq,
};
