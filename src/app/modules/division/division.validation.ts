import { z } from "zod";

const create = z.object({
  body: z.object({
    divisions: z
      .object({
        name: z.string({ required_error: "Name is required" }),
      })
      .array(),
  }),
});

export const DivisionValidation = {
  create,
};
