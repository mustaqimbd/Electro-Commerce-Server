import { z } from "zod";

const createCustomer = z.object({
  body: z.object({
    phoneNumber: z.string({ required_error: "Phone number is required" }),
    email: z.string().email().optional(),
    password: z.string({ required_error: "Password is required" }),
    customersInfo: z.object({
      fullName: z.string().optional(),
      fullAddress: z.string().optional(),
    }),
  }),
});

export const UsersValidation = {
  createCustomer,
};
