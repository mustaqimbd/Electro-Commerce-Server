import { z } from "zod";

const createCoupon = z.object({
  body: z.object({
    name: z.string({ required_error: "Coupon name is required" }),
    shortDescription: z.string().optional(),
    code: z.string(),
    percentage: z
      .number({ required_error: "Coupon percentage is required" })
      .min(0),
    endDate: z.string({ required_error: "End date is required" }),
    maxDiscountAmount: z.number().optional(),
    limitDiscountAmount: z.boolean({
      required_error: "Limit discount is required",
    }),
  }),
});

const updateCoupon = z.object({
  body: z.object({
    isDeleted: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const CouponValidation = { createCoupon, updateCoupon };
