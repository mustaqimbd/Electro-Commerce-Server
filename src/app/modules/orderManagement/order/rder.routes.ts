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
router.post(
  "/landing-page",
  validateRequest(OrderValidation.createOrderValidation),
  optionalAuthGuard,
  OrderController.createOrderFromSalesPage
);

router.get("/customer/:orderId", OrderController.getOrderInfoByOrderIdCustomer);

router.get("/admin/order-id/:id", OrderController.getOrderInfoByOrderIdAdmin);

router.get(
  "/customer",
  optionalAuthGuard,
  OrderController.getAllOrderCustomers
);

router.get(
  "/admin/all-orders",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  OrderController.getAllOrdersAdmin
);

router.patch(
  "/update-status/:id",
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
