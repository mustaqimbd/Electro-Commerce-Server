import { z } from "zod";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";

const checkWarranty = z.object({
  body: z.object({
    phoneNumber: genericPhoneNumberZodSchema(),
    warrantyCode: z.string({ required_error: "Warranty code is required." }),
  }),
});

export const ClaimWarrantyValidation = { checkWarranty };
