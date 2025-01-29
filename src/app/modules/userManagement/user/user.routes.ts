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
    requiredRoles: ["superAdmin", "admin", "staff"],
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
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage admin or staff",
  }),
  employPhotoUploader.array("image", 1),
  validateRequest(UserValidation.createStaffOrAdmin),
  UserControllers.createAdminOrStaff
);

router.patch(
  "/update-admin-or-staff/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage admin or staff",
  }),
  employPhotoUploader.array("image", 1),
  validateRequest(UserValidation.updateStaffOrAdmin),
  UserControllers.updateAdminOrStaff
);

router.get(
  "/profile",
  authGuard({ requiredRoles: ["superAdmin", "admin", "customer", "staff"] }),
  UserControllers.getUserProfile
);

export const UserRoutes = router;
