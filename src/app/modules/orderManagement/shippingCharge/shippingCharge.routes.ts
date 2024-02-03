import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import { ShippingChargeController } from "./shippingCharge.controller";

const router = Router();

router.get("/", optionalAuthGuard, ShippingChargeController.getShippingCharges);

router.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage shipping charges",
  }),
  ShippingChargeController.createShippingCharge
);

export const ShippingChargeRoutes = router;
