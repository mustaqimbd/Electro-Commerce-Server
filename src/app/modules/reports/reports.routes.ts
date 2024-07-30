import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import { ReportsController } from "./reports.controller";

const route = Router();

const requiredPermission = "super admin";

route.get(
  "/orders",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getOrders
);

route.get(
  "/orders-count",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getOrderCountsByStatus
);

route.get(
  "/orders-source",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getSourceCounts
);

export const ReportsRoutes = route;
