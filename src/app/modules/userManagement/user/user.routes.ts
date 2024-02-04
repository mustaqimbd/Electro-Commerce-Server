import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/create-customer",
  validateRequest(UserValidation.createCustomer),
  UserControllers.createCustomer
);
router.post(
  "/create-staff-or-admin",
  validateRequest(UserValidation.createStaffOrAdmin),
  // authGuard({
  //   requiredRoles: ["admin"],
  //   requiredPermission: "create admin or staff",
  // }),
  UserControllers.createAdminOrStaff
);

router.get(
  "/profile",
  authGuard({ requiredRoles: ["customer", "staff", "admin"] }),
  UserControllers.getUserProfile
);

export const UserRoutes = router;
