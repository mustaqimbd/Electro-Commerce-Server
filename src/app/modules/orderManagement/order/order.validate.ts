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

const updateOrderDetailsByAdmin = z.object({
  body: z.object({
    subtotal: z.number().optional(),
    officialNotes: z.string().optional(),
    shipping: z
      .object({
        fullName: z.string().optional(),
        phoneNumber: z.string().optional(),
        fullAddress: z.string().optional(),
      })
      .optional(),
  }),
});

const deleteOrders = z.object({
  body: z.object({
    orderIds: z.string().array().nonempty({ message: "Can't be empty" }),
  }),
});

export const OrderValidation = {
  createOrderValidation,
  updateOrderStatus,
  updateOrderDetailsByAdmin,
  deleteOrders,
};
