import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import optionalAuthGuard from "../../middlewares/optionalAuthGuard";
import validateRequest from "../../middlewares/validateRequest";
import { CouponController } from "./coupon.controller";
import { CouponValidation } from "./coupon.validation";

const route = Router();

route.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  validateRequest(CouponValidation.createCoupon),
  CouponController.createCoupon
);

route.get(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  CouponController.getAllCoupons
);

route.patch(
  "/:id",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage coupon",
  }),
  validateRequest(CouponValidation.updateCoupon),
  CouponController.updateCouponCode
);

route.post(
  "/calculate-coupon-discount",
  optionalAuthGuard,
  CouponController.calculateCouponDiscount
);

route.get("/tags", CouponController.getAllTags);

route.get("/:code", CouponController.getSingleCoupon);

export const CouponRoutes = route;
