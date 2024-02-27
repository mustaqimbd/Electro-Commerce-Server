import { z } from "zod";
import { genericPhoneNumberZodSchema } from "../../userManagement/user/user.validation";

export const shippingValidationZodSchema = (
  isWithNameAndContact: boolean = false
) =>
  isWithNameAndContact
    ? z.object({
        fullName: z.string({ required_error: "Name is required" }),
        phoneNumber: genericPhoneNumberZodSchema(),
        fullAddress: z.string({ required_error: "Full address is required" }),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      })
    : z.object({
        fullAddress: z.string({ required_error: "Full address is required" }),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
      });
