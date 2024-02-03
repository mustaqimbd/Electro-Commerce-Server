import { Router } from "express";
import config from "../../../config/config";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validate";

const router = Router();

router.post(
  "/",
  validateRequest(OrderValidation.createOrderValidation),
  optionalAuthGuard,
  OrderController.createOrder
);

router.get("/:orderId", OrderController.getOrderInfoByOrderId);

router.get(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  OrderController.getAllOrders
);

router.patch(
  "/update-status/:orderId",
  validateRequest(OrderValidation.updateOrderStatus),
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  OrderController.updateStatus
);

if (config.env === "development") {
  router.delete("/seed", OrderController.seed); // TODO: delete this on production
}

export const OrderRoutes = router;
