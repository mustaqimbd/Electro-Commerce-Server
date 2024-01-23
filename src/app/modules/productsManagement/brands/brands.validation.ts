import { z } from "zod";

const brandValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Brand name is required!" }),
    description: z.string().optional(),
    logo: z.string().optional(),
  }),
});
export default brandValidationSchema;
