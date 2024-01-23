import { z } from "zod";

const categoryValidationSchema = z.object({
  body: z.object({
    categoryName: z.string().min(1, { message: "Category name is required!" }),
  }),
});
export default categoryValidationSchema;
