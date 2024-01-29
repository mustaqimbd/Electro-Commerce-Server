import { z } from "zod";

const tag = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Tag name is required!" }),
  }),
});

export const TagValidation = {
  tag,
};
