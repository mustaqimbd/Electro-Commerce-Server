import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
import { ReportsController } from "./reports.controller";

const route = Router();

const requiredPermission = "super admin";

route.get(
  "/orders-count",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getOrdersCounts
);

route.get(
  "/orders-count-status",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getOrderCountsByStatus
);

route.get(
  "/orders-source-count",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getSourceCounts
);

route.get(
  "/orders-status-change-count",
  authGuard({ requiredRoles: ["admin"], requiredPermission }),
  ReportsController.getOrderStatusChangeCounts
);

export const ReportsRoutes = route;
