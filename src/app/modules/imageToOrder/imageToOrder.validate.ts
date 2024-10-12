import { z } from "zod";
import { shippingValidationZodSchema } from "../orderManagement/shipping/shipping.validation";
import { ImageToOrderConst } from "./imageToOrder.const";

const createReq = z.object({
  body: z.object({
    shipping: shippingValidationZodSchema(true),
    customerNotes: z.string().optional(),
  }),
});

const updateRequest = z.object({
  body: z.object({
    contactStatus: z
      .enum([...ImageToOrderConst.contactStatusEnum] as [string, ...string[]])
      .optional(),
    status: z
      .enum([...ImageToOrderConst.statusEnum] as [string, ...string[]])
      .optional(),
  }),
});

export const ImageToOrderValidate = {
  createReq,
  updateRequest,
};
