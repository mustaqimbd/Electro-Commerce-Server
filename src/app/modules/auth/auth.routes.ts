import express from "express";
import authGuard from "../../middlewares/authGuard";
import limitRequest from "../../middlewares/requestLimitHandler";
import { AuthControllers } from "./auth.controller";

const route = express.Router();

route.post("/login", limitRequest(1), AuthControllers.login);
route.post("/access-token", AuthControllers.refreshToken);
route.post(
  "/change-password",
  authGuard({
    requiredRoles: ["admin", "customer", "staff"],
  }),
  AuthControllers.changePassword
);

export const AuthRouters = route;
