import express from "express";
import { ENUM_USER_ROLE } from "../../../enums/users";
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
  authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(UserValidation.createStaffOrAdmin),
  UserControllers.createAdminOrStaff
);

export const UserRoutes = router;
