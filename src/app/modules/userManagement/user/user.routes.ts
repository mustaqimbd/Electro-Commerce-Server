import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { employPhotoUploader } from "../../../utilities/imgUploader";
import { UserControllers } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

router.get(
  "/all-admin-staff",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage admin or staff",
  }),
  UserControllers.getAllAdminAndStaff
);

router.post(
  "/create-customer",
  validateRequest(UserValidation.createCustomer),
  UserControllers.createCustomer
);

router.post(
  "/create-staff-or-admin",
  authGuard({
    requiredRoles: ["admin"],
    requiredPermission: "manage admin or staff",
  }),
  employPhotoUploader.array("image", 1),
  validateRequest(UserValidation.createStaffOrAdmin),
  UserControllers.createAdminOrStaff
);

router.get(
  "/profile",
  authGuard({ requiredRoles: ["customer", "staff", "admin"] }),
  UserControllers.getUserProfile
);

export const UserRoutes = router;
