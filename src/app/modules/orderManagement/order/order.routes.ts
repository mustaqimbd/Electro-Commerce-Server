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
  limitRequest(1, 3),
  OrderController.createOrder
);

router.get(
  "/customer/:id",
  optionalAuthGuard,
  OrderController.getOrderInfoByOrderIdCustomer
);

router.get(
  "/admin/order-id/:id",
  // authGuard({
  //   requiredRoles: ["admin", "staff"],
  //   //   requiredPermission: "manage orders",
  // }),
  OrderController.getOrderInfoByOrderIdAdmin
);

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
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  validateRequest(OrderValidation.updateOrderStatus),
  OrderController.updateStatus
);

router.patch(
  "/update-processing-status",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage warehouse",
  }),
  validateRequest(OrderValidation.updateProcessingStatus),
  OrderController.updateProcessingStatus
);

router.patch(
  "/book-courier-and-update-status",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage courier",
  }),
  validateRequest(OrderValidation.bookCourierAndUpdateStatus),
  OrderController.bookCourierAndUpdateStatus
);

router.patch(
  "/update-order/:id",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.updateOrderDetailsByAdmin),
  OrderController.updateOrderDetailsByAdmin
);

router.delete(
  "/delete-many",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.deleteOrders),
  OrderController.deleteOrdersById
);

router.patch(
  "/update-quantity/:id",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(OrderValidation.updateQuantity),
  OrderController.updateOrderedProductQuantityByAdmin
);

router.get(
  "/orders-count-by-status",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  OrderController.orderCountsByStatus
);

router.post(
  "/update-order-delivery-status",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage courier",
  }),
  OrderController.updateOrdersDeliveryStatus
);

router.get(
  "/get-customer-order-count/:phoneNumber",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage orders",
  }),
  OrderController.getCustomersOrdersCountByPhone
);

export const OrderRoutes = router;
