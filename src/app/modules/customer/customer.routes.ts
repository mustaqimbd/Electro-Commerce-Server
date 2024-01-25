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

export const CustomerRoute = router;
