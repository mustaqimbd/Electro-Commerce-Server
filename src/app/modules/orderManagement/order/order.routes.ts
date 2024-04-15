import { Router } from "express";
// import authGuard from "../../../middlewares/authGuard";
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

router.get("/customer/:orderId", OrderController.getOrderInfoByOrderIdCustomer);

router.get("/admin/order-id/:id", OrderController.getOrderInfoByOrderIdAdmin);

router.get(
  "/customer",
  optionalAuthGuard,
  OrderController.getAllOrderCustomers
);

router.get(
  "/admin/all-orders",
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   //   requiredPermission: "manage orders",
  // }),
  OrderController.getAllOrdersAdmin
);

router.patch(
  "/update-status",
  validateRequest(OrderValidation.updateOrderStatus),
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   // requiredPermission: "manage orders",
  // }),
  OrderController.updateStatus
);

router.patch(
  "/update-order/:id",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.updateOrderDetailsByAdmin),
  OrderController.updateOrderDetails
);

router.delete(
  "/delete-many",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.deleteOrders),
  OrderController.deleteOrdersById
);

router.patch(
  "/update-quantity/:id",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.updateQuantity),
  OrderController.updateOrderedProductQuantityByAdmin
);

router.get(
  "/orders-count-by-status",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.orderCountsByStatus
);

export const OrderRoutes = router;
