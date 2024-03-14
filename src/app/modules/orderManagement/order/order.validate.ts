import { z } from "zod";
import { paymentZodSchema } from "../orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../shipping/shipping.validation";
import { orderStatus } from "./order.const";

const createOrderValidation = z.object({
  body: z.object({
    payment: paymentZodSchema,
    shippingChargeId: z.string({
      required_error: "Shipping charge id is required",
    }),
    shipping: shippingValidationZodSchema(true),
    orderFrom: z.string({ required_error: "Order from is required." }),
  }),
});

const updateOrderStatus = z.object({
  body: z.object({
    status: z.enum([...orderStatus] as [string, ...string[]]),
    message: z.string().optional(),
  }),
  // .refine((data) => {
  //   let res = true;
  //   if (data.status === "canceled") {
  //     if (!data.message) {
  //       res = false;
  //     }
  //   }
  //   return res;
  // }, "Please provide the message"),
});

export const OrderValidation = {
  createOrderValidation,
  updateOrderStatus,
};
