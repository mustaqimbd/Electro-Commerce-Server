import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { CustomerControllers } from "./customer.controller";
import { CustomerValidation } from "./customer.validation";
const router = express.Router();

router.get(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  CustomerControllers.getAllCustomer
);

router.get(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin", "staff"] }),
  CustomerControllers.getSingleCustomerByAdmin
);

router.patch(
  "/",
  authGuard({ requiredRoles: ["customer"] }),
  validateRequest(CustomerValidation.updateUser),
  CustomerControllers.updateCustomer
);

export const CustomerRoutes = router;
