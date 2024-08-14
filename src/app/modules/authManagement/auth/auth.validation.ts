import { z } from "zod";
import {
  passwordZodSchema,
  phoneNumberValidationZodSchema,
} from "../../userManagement/user/user.validation";

const login = z.object({
  body: z.object({
    phoneEmailOrUid: z.string({
      required_error: "Phone number email or UID is required",
    }),
    password: z.string({ required_error: "Password is required" }),
  }),
});

export const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: "Unauthorized request" }),
  }),
});

const changePassword = z.object({
  body: z.object({
    previousPassword: z.string({
      required_error: "Previous password is required",
    }),
    newPassword: passwordZodSchema,
  }),
});

const forgetPassword = z.object({
  body: z.object({
    phoneNumber: z.string({ required_error: "Phone number is required." }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    phoneNumber: phoneNumberValidationZodSchema(),
    otp: z.string({ required_error: "Otp is must required." }),
    newPassword: z.string({ required_error: "New password is required" }),
  }),
});

export const AuthValidation = {
  login,
  changePassword,
  forgetPassword,
  resetPassword,
};
