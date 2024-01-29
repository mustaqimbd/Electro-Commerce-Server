import { Router } from "express";
import { PermissionController } from "./permission.controller";

const router = Router();

router.post("/", PermissionController.createPermission);

export const PermissionRoutes = router;
