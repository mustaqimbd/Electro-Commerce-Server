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

// router.get("/update-all", async (req, res) => {
//   try {
//     const batchSize = 50; // Adjust batch size as needed
//     const totalOrders = await Order.countDocuments();
//     let processedCount = 0;

//     while (processedCount < totalOrders) {
//       // Find orders in batches
//       const orders = await Order.find()
//         .populate("orderedProductsDetails")
//         .skip(processedCount)
//         .limit(batchSize);

//       // Iterate over each order in the batch
//       for (const order of orders) {
//         const productDetails = [];

//         // Extract product details from orderedProductsDetails and populate into productDetails
//         if (
//           order.orderedProductsDetails &&
//           order.orderedProductsDetails.productDetails
//         ) {
//           for (const orderedProduct of order?.orderedProductsDetails
//             ?.productDetails || []) {
//             const { product, unitPrice, quantity, total } = orderedProduct;
//             productDetails.push({ product, unitPrice, quantity, total });
//           }
//         }

//         // Update the productDetails field in the order
//         await Order.findByIdAndUpdate(order._id, { $set: { productDetails } });
//       }

//       processedCount += batchSize;
//       console.log(`Processed ${processedCount} out of ${totalOrders} orders`);
//     }

//     console.log("Product details migration completed successfully!");
//   } catch (error) {
//     console.error("Error migrating product details:", error);
//   }
//   res.send(["ok"]);
// });

export const OrderRoutes = router;
