import { z } from "zod";

const updateUser = z.object({
  body: z.object({
    fullName: z.string().optional(),
    address: z
      .object({
        fullAddress: z.string().optional(),
      })
      .optional(),
  }),
});

export const CustomerValidation = {
  updateUser,
};
