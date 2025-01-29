import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import validateRequest from "../../middlewares/validateRequest";
import { CouponController } from "./coupon.controller";
import { CouponValidation } from "./coupon.validation";

const route = Router();

route.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  validateRequest(CouponValidation.createCoupon),
  CouponController.createCoupon
);

route.get(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  CouponController.getAllCoupons
);

route.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  validateRequest(CouponValidation.updateCoupon),
  CouponController.updateCouponCode
);

route.get("/:code", CouponController.getSingleCoupon);

export const CouponRoutes = route;
