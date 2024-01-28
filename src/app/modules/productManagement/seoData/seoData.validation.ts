import { z } from "zod";

export const seoDataValidationSchema = z.object({
  focusKeyphrase: z
    .string()
    .min(1, { message: "Focus Keyphrase is required!" }),
  metaTitle: z.string().min(1, { message: "Meta Titleis required!" }),
  slug: z.string().min(1, { message: "Slug is required!" }),
  metaDescription: z
    .string()
    .min(1, { message: "Meta description is required!" }),
});

export const updatesSeoDataValidationSchema = z.object({
  body: z.object({
    focusKeyphrase: z
      .string()
      .min(1, { message: "Focus Keyphrase is required!" })
      .optional(),
    metaTitle: z
      .string()
      .min(1, { message: "Meta Titleis required!" })
      .optional(),
    slug: z.string().min(1, { message: "Slug is required!" }).optional(),
    metaDescription: z
      .string()
      .min(1, { message: "Meta description is required!" })
      .optional(),
  }),
});
