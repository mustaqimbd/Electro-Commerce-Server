import { z } from "zod";
import { paymentZodSchema } from "../../orderManagement/orderPayment/orderPayment.validation";
import { shippingValidationZodSchema } from "../../orderManagement/shipping/shipping.validation";
import { phoneNumberValidationZodSchema } from "../../userManagement/user/user.validation";
import {
  warrantyApprovalStatus,
  warrantyClaimedContactStatus,
  warrantyClaimedProductCondition,
} from "./warrantyClaim.const";

const checkWarranty = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    warrantyCodes: z
      .string({ required_error: "Warranty code is required." })
      .array(),
  }),
});

const createWarrantyClaimReq = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    warrantyCodes: z
      .string({ required_error: "Warranty codes is required." })
      .array(),
    shipping: shippingValidationZodSchema(true),
    problemInDetails: z.string({
      required_error: "Problem details is required",
    }),
  }),
});

const updateWarrantyClaimReq = z.object({
  body: z.object({
    shipping: shippingValidationZodSchema(true).optional(),
    officialNotes: z.string().optional(),
    phoneNumber: z.string().optional(),
    result: z
      .enum([...warrantyClaimedProductCondition] as [string, ...string[]])
      .optional(),
    approvalStatus: z
      .enum([...warrantyApprovalStatus] as [string, ...string[]])
      .optional(),
    contactStatus: z
      .enum([...warrantyClaimedContactStatus] as [string, ...string[]])
      .optional(),
    warrantyClaimReqData: z.string().array().optional(),
  }),
});

const updateContactStatus = z.object({
  body: z.object({
    warrantyClaimedReqIds: z
      .string({ required_error: "Warranty claim ids is required" })
      .array(),
    status: z.enum([...warrantyClaimedContactStatus] as [string, ...string[]]),
  }),
});

const approveAndCreateOrder = z.object({
  body: z.object({
    payment: paymentZodSchema,
    shippingCharge: z.string({
      required_error: "Shipping charge id is required",
    }),
  }),
});

export const WarrantyClaimValidation = {
  checkWarranty,
  createWarrantyClaimReq,
  updateWarrantyClaimReq,
  updateContactStatus,
  approveAndCreateOrder,
};
