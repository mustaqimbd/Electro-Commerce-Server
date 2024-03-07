import { z } from "zod";

const seoData = z.object({
  focusKeyphrase: z
    .string()
    .min(1, { message: "Focus Keyphrase is required!" }),
  metaTitle: z.string().min(1, { message: "Meta Titleis required!" }),
  slug: z.string().min(1, { message: "Slug is required!" }),
  metaDescription: z
    .string()
    .min(1, { message: "Meta description is required!" }),
});

const updatesSeoData = z.object({
  focusKeyphrase: z
    .string()
    .min(1, { message: "Focus Keyphrase is required!" })
    .optional(),
  metaTitle: z.string().min(1, { message: "Meta Title required!" }).optional(),
  slug: z.string().min(1, { message: "Slug is required!" }).optional(),
  metaDescription: z
    .string()
    .min(1, { message: "Meta description is required!" })
    .optional(),
});

export const SeoDataValidation = {
  seoData,
  updatesSeoData,
};
