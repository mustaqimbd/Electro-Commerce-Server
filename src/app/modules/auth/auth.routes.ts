import express from "express";
import { ENUM_USER_ROLE } from "../../enums/users";
import auth from "../../middlewares/auth";
import limitRequest from "../../middlewares/requestLimitHandler";
import { AuthControllers } from "./auth.controller";

const route = express.Router();

route.post("/login", limitRequest(1), AuthControllers.login);
route.post("/access-token", AuthControllers.refreshToken);
route.post(
  "/change-password",
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.CUSTOMER, ENUM_USER_ROLE.STAFF),
  AuthControllers.changePassword,
);

export const AuthRouter = route;
