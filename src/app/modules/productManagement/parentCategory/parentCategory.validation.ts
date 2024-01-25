import { z } from "zod";

const parentCategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, { message: "Category name is required!" }),
  }),
});
export default parentCategoryValidationSchema;
