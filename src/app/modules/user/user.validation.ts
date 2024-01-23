import { z } from "zod";
const phoneNumberRegex = /^(?!.*[a-zA-Z])01\d{9}$/;

const phoneNumberSchema = z
  .string({ required_error: "hone number is required." })
  .refine((value) => phoneNumberRegex.test(value), {
    message:
      "Please provide a valid mobile number starting with 01 and with a total of 11 digits.",
  });

const createCustomer = z.object({
  body: z.object({
    phoneNumber: phoneNumberSchema,
    email: z.string().email().optional(),
    password: z.string({ required_error: "Password is required" }),
    customerInfo: z.object({
      fullName: z.string().optional(),
      fullAddress: z.string().optional(),
    }),
  }),
});

const createStaffOrAdmin = z.object({
  body: z.object({
    phoneNumber: phoneNumberSchema,
    email: z.string({ required_error: "Email is required." }).email(),
    password: z.string({ required_error: "Password is required" }),
    role: z.enum(["staff", "admin"], { required_error: "Role is required" }),
    personalInfo: z
      .object({
        fullName: z.string({ required_error: "Full name is required." }),
        fullAddress: z.string({ required_error: "Full address is required" }),
        profilePicture: z.string().optional(), // TODO: Make image uploading system.
      })
      .optional(), // TODO: make mandatory.
  }),
});

export const UserValidation = {
  createCustomer,
  createStaffOrAdmin,
};
