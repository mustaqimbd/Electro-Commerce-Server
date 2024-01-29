import { Router } from "express";
import { AdminControllers } from "./admin.controller";

const router = Router();

router.patch(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  AdminControllers.updateAdmin
);

export const AdminRoutes = router;
