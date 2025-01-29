import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ShippingChargeController } from "./shippingCharge.controller";
import { ShippingCHargeValidation } from "./shippingCharge.validate";

const router = Router();

router.get("/", ShippingChargeController.getShippingCharges);

router.get(
  "/admin",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  ShippingChargeController.getShippingChargesAdmin
);

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  validateRequest(ShippingCHargeValidation.createShippingCharge),
  ShippingChargeController.createShippingCharge
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  validateRequest(ShippingCHargeValidation.updateShippingCharge),
  ShippingChargeController.updateShippingCharge
);

export const ShippingChargeRoutes = router;
