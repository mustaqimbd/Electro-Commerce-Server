import express from "express";
import { ENUM_USER_ROLE } from "../../enums/users";
import auth from "../../middlewares/auth";
import { CustomerControllers } from "./customer.controller";
const router = express.Router();

router.get("/", auth(ENUM_USER_ROLE.ADMIN), CustomerControllers.getAllCustomer);

export const CustomerRoute = router;
