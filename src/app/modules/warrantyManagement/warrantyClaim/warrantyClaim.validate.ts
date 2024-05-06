import { z } from "zod";
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
    contactStatus: z
      .enum([...warrantyClaimedContactStatus] as [string, ...string[]])
      .optional(),
    result: z
      .enum([...warrantyClaimedProductCondition] as [string, ...string[]])
      .optional(),
    approvalStatus: z
      .enum([...warrantyApprovalStatus] as [string, ...string[]])
      .optional(),
  }),
});

export const WarrantyClaimValidation = {
  checkWarranty,
  createWarrantyClaimReq,
  updateWarrantyClaimReq,
};
