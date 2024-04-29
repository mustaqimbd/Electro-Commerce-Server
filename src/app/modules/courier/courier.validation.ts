import { z } from "zod";

const TCourierCredentialsSchema = z.tuple([
  z.string({ required_error: "key is required" }),
  z.string({ required_error: "Value is required" }),
]);
const createCourier = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }),
    image: z.string({ required_error: "Image is required" }),
    website: z.string().optional(),
    credentials: z.array(TCourierCredentialsSchema, {
      required_error: "Credentials is required",
    }),
  }),
});

export const CourierValidation = {
  createCourier,
};
