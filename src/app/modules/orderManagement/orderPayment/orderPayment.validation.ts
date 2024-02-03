import { z } from "zod";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";
import { paymentMethodEnum } from "./orderPayment.const";

export const paymentZodSchema = z
  .object({
    paymentMethod: z.enum([...paymentMethodEnum] as [string, ...string[]]),
    phoneNumber: genericPhoneNumberZodSchema(true),
    transactionId: z
      .string({ required_error: "Transaction ID is required" })
      .optional(),
  })
  .refine((data) => {
    if (data.paymentMethod !== "cod") {
      return !!data.phoneNumber && !!data.transactionId;
    }
    return true;
  }, "Please provide both the phone number and the transaction ID.");
