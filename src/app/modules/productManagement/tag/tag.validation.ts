import { z } from "zod";

const tagValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Tag name is required!" }),
  }),
});
export default tagValidationSchema;
