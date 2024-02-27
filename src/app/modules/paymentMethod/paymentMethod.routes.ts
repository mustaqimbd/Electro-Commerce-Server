import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import { PaymentMethodController } from "./paymentMethod.controller";
const route = Router();

route.get("/", PaymentMethodController.getPaymentMethods);
route.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  PaymentMethodController.createPaymentMethod
);

export const paymentMethodRoutes = route;
