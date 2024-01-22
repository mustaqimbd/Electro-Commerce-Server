import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserController } from "./users.controller";
import { UsersValidation } from "./users.validate";

const router = express.Router();

router.post(
  "/create-customer",
  validateRequest(UsersValidation.createCustomer),
  UserController.createCustomer,
);
router.post(
  "/create-staff-or-admin",
  validateRequest(UsersValidation.createCustomer),
  UserController.createCustomer,
);

export const UsersRoute = router;
