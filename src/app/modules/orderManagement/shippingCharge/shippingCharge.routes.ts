import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { ShippingChargeController } from "./shippingCharge.controller";
import { ShippingCHargeValidation } from "./shippingCharge.validate";

const router = Router();

router.get("/", optionalAuthGuard, ShippingChargeController.getShippingCharges);

router.get(
  "/admin",
  optionalAuthGuard,
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  ShippingChargeController.getShippingChargesAdmin
);

router.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  validateRequest(ShippingCHargeValidation.createShippingCharge),
  ShippingChargeController.createShippingCharge
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  validateRequest(ShippingCHargeValidation.updateShippingCharge),
  ShippingChargeController.updateShippingCharge
);

export const ShippingChargeRoutes = router;
