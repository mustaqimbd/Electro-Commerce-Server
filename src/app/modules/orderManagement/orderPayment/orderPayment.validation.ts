import { z } from "zod";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";

export const paymentZodSchema = z.object({
  paymentMethod: z.string({ required_error: "Payment method is required" }),
  phoneNumber: genericPhoneNumberZodSchema(true),
  transactionId: z.string().optional(),
});
