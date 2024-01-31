import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import { PermissionController } from "./permission.controller";

const router = Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
  }),
  PermissionController.getPermissions
);

router.post(
  "/",
  authGuard({
    requiredRoles: ["admin"],
    requiredPermission: "create permission",
  }),
  PermissionController.createPermission
);

export const PermissionRoutes = router;
