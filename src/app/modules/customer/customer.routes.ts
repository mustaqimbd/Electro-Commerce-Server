import express from "express";
import { ENUM_USER_ROLE } from "../../enums/users";
import authGuard from "../../middlewares/authGuard";
import { CustomerControllers } from "./customer.controller";
const router = express.Router();

router.get(
  "/",
  authGuard(ENUM_USER_ROLE.ADMIN),
  CustomerControllers.getAllCustomer
);

router.patch(
  "/",
  authGuard(ENUM_USER_ROLE.CUSTOMER),
  CustomerControllers.updateCustomer
);

export const CustomerRoutes = router;
