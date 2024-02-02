import { z } from "zod";
import { paymentZodSchema } from "../payment/payment.validation";

const createOrderValidation = z.object({
  body: z.object({
    payment: paymentZodSchema,
  }),
});

export const OrderValidation = {
  createOrderValidation,
};
