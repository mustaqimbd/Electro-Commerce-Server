import { z } from "zod";
import { shippingValidationZodSchema } from "../../orderManagement/shipping/shipping.validation";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";

const checkWarranty = z.object({
  body: z.object({
    phoneNumber: genericPhoneNumberZodSchema(),
    warrantyCodes: z
      .string({ required_error: "Warranty code is required." })
      .array(),
  }),
});

const createWarrantyClaimReq = z.object({
  body: z.object({
    phoneNumber: genericPhoneNumberZodSchema(),
    warrantyCodes: z
      .string({ required_error: "Warranty codes is required." })
      .array(),
    shipping: shippingValidationZodSchema(true),
    problemInDetails: z.string({
      required_error: "Problem details is required",
    }),
  }),
});

export const ClaimWarrantyValidation = {
  checkWarranty,
  createWarrantyClaimReq,
};
