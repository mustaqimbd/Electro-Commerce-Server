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

export const ReportsRoutes = route;
