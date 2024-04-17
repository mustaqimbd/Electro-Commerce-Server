import { z } from "zod";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";
import { paymentZodSchema } from "../orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../shipping/shipping.validation";
import { orderSources, orderStatus } from "./order.const";

const createOrderValidation = z.object({
  body: z
    .object({
      payment: paymentZodSchema,
      shippingCharge: z.string({
        required_error: "Shipping charge id is required",
      }),
      shipping: shippingValidationZodSchema(true),
      eventId: z.string({ required_error: "Event id is required." }),
      orderSource: z.object(
        {
          name: z.enum([...orderSources] as [string, ...string[]], {
            required_error: "Source name is required.",
          }),
          url: z.string().optional(),
          lpNo: z.string().optional(),
        },
        { required_error: "Some value from order source is required." }
      ),
      orderedProducts: z
        .object({
          quantity: z.number(),
          product: z.string(),
        })
        .array()
        .optional(),
      custom: z.boolean().optional(),
      salesPage: z.boolean().optional(),
      advance: z.number().optional(),
      orderNotes: z.string().optional(),
      officialNotes: z.string().optional(),
      invoiceNotes: z.string().optional(),
      courierNotes: z.string().optional(),
    })
    .refine(
      (data) => {
        // If either custom or salesPage is true, orderedProducts should be present
        return (
          (!data?.custom && !data?.salesPage) ||
          data?.orderedProducts?.length ||
          0 > 0
        );
      },
      {
        message:
          "Ordered products are required when the order is either custom or from the sales page",
        path: ["orderedProducts"],
      }
    ),
});

const updateOrderStatus = z.object({
  body: z.object({
    status: z.enum([...orderStatus] as [string, ...string[]]),
    message: z.string().optional(),
    orderIds: z.string({ required_error: "Order ids is required" }).array(),
  }),
});

const updateOrderDetailsByAdmin = z.object({
  body: z.object({
    discount: z.number().optional(),
    officialNotes: z.string().optional(),
    invoiceNotes: z.string().optional(),
    courierNotes: z.string().optional(),
    shipping: z
      .object({
        fullName: z.string().optional(),
        phoneNumber: genericPhoneNumberZodSchema(true),
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

const updateQuantity = z.object({
  body: z.object({
    orderedItemId: z.string({ required_error: "Ordered item id is required." }),
    quantity: z.number({ required_error: "New quantity is required." }),
  }),
});

export const OrderValidation = {
  createOrderValidation,
  updateOrderStatus,
  updateOrderDetailsByAdmin,
  deleteOrders,
  updateQuantity,
};
