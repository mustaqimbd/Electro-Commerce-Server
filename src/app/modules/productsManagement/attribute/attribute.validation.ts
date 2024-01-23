import { z } from "zod";

const attributeValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Attribute name is required!" }),
    values: z.array(
      z.string().min(1, { message: "Attribute value is required!" })
    ),
  }),
});
export default attributeValidationSchema;
