import { z } from "zod";

export const validateDateInput = ({
  errorMessage = "Invalid date format. Please provide a valid date.",
}: {
  errorMessage?: string;
} = {}) =>
  z.string().superRefine((value, ctx) => {
    if (value !== undefined && value.trim() !== "") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage,
        });
      }
    }
  });
