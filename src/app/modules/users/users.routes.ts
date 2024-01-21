import express from "express";
import { UserController } from "./users.controller";

const router = express.Router();

router.post("/create-customer", UserController.createCustomer);

export const UsersRoute = router;
