import { z } from "zod";
const phoneNumberRegex = /^(?!.*[a-zA-Z])01\d{9}$/;
const passwordValidatorRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%&*]).{8,}$/;

export const genericPhoneNumberZodSchema = (isOptional: boolean = false) =>
  isOptional
    ? z
        .string({ required_error: "Phone number is required." })
        .refine((value) => phoneNumberRegex.test(value), {
          message:
            "Please provide a valid mobile number starting with 01 and with a total of 11 digits.",
        })
        .optional()
    : z
        .string({ required_error: "Phone number is required." })
        .refine((value) => phoneNumberRegex.test(value), {
          message:
            "Please provide a valid mobile number starting with 01 and with a total of 11 digits.",
        });

export const passwordZodSchema = z
  .string({ required_error: "Password is required" })
  .refine((password) => passwordValidatorRegex.test(password), {
    message:
      "Invalid password. It must be 8 characters long with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@#$%&*).",
  });

const createAddressSchema = (fullAddressRequired = false) =>
  z.object({
    fullAddress: fullAddressRequired
      ? z.string({ required_error: "Full address is required" })
      : z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  });

const createCustomer = z.object({
  body: z.object({
    phoneNumber: genericPhoneNumberZodSchema(),
    email: z.string().email().optional(),
    password: passwordZodSchema,
    address: createAddressSchema(),
    personalInfo: z.object({
      fullName: z.string().optional(),
    }),
  }),
});

const createStaffOrAdmin = z.object({
  body: z.object({
    phoneNumber: genericPhoneNumberZodSchema(),
    email: z.string({ required_error: "Email is required." }).email(),
    password: passwordZodSchema,
    role: z.enum(["staff", "admin"], { required_error: "Role is required" }),
    address: createAddressSchema(),
    personalInfo: z.object(
      {
        fullName: z.string({ required_error: "Full name is required." }),
        profilePicture: z.string().optional(), // TODO: Make image uploading system.
        emergencyContact: z.string({
          required_error: "Emergency contact is required",
        }),
        NIDNo: z.string().optional(),
        birthCertificateNo: z.string().optional(),
        joiningDate: z.string().optional(),
      },
      { required_error: "Some properties from personal info is required" }
    ),
  }),
});

export const UserValidation = {
  createCustomer,
  createStaffOrAdmin,
};
