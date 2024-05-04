import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import optionalAuthGuard from "../../../middlewares/optionalAuthGuard";
import limitRequest from "../../../middlewares/requestLimitHandler";
import validateRequest from "../../../middlewares/validateRequest";
import { OrderController } from "./order.controller";
import { OrderValidation } from "./order.validate";

const router = Router();

router.post(
  "/",
  validateRequest(OrderValidation.createOrderValidation),
  optionalAuthGuard,
  limitRequest(
    60,
    3,
    "For assistance with additional orders, please contact support. Thank you for your understanding!"
  ),
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
  validateRequest(OrderValidation.getOrdersAdmin),
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   //   requiredPermission: "manage orders",
  // }),
  OrderController.getAllOrdersAdmin
);

router.get(
  "/admin/processing-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   //   requiredPermission: "manage orders",
  // }),
  OrderController.getProcessingOrdersAdmin
);

router.get(
  "/admin/processing-done-on-courier-orders",
  validateRequest(OrderValidation.getOrdersAdmin),
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   //   requiredPermission: "manage orders",
  // }),
  OrderController.getProcessingDoneCourierOrdersAdmin
);

router.patch(
  "/update-status",
  validateRequest(OrderValidation.updateOrderStatus),
  authGuard({
    requiredRoles: ["admin", "staff"],
    // requiredPermission: "manage orders",
  }),
  OrderController.updateStatus
);

router.patch(
  "/update-processing-status",
  validateRequest(OrderValidation.updateProcessingStatus),
  authGuard({
    requiredRoles: ["admin", "staff"],
    // requiredPermission: "manage orders",
  }),
  OrderController.updateProcessingStatus
);

router.patch(
  "/book-courier-and-update-status",
  validateRequest(OrderValidation.bookCourierAndUpdateStatus),
  authGuard({
    requiredRoles: ["admin", "staff"],
    // requiredPermission: "manage orders",
  }),
  OrderController.bookCourierAndUpdateStatus
);

router.patch(
  "/update-order/:id",
  validateRequest(OrderValidation.updateOrderDetailsByAdmin),
  authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.updateOrderDetailsByAdmin
);

router.delete(
  "/delete-many",
  validateRequest(OrderValidation.deleteOrders),
  authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.deleteOrdersById
);

router.patch(
  "/update-quantity/:id",
  validateRequest(OrderValidation.updateQuantity),
  authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.updateOrderedProductQuantityByAdmin
);

router.get(
  "/orders-count-by-status",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.orderCountsByStatus
);

router.post(
  "/update-order-delivery-status",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.updateOrdersDeliveryStatus
);

export const OrderRoutes = router;
