import { z } from "zod";

const create = z.object({
  body: z.object({
    districts: z
      .object({
        name: z.string({ required_error: "Name is required" }),
        bn_name: z.string({ required_error: "Name is required" }),
        division_id: z.string({ required_error: "Name is required" }),
      })
      .array(),
  }),
});

export const DistrictValidation = {
  create,
};
