import express from "express";
import limitRequest from "../../middlewares/requestLimitHandler";
import { AuthControllers } from "./auth.controller";

const route = express.Router();

route.post("/login", limitRequest(1), AuthControllers.login);
route.post("/access-token", AuthControllers.refreshToken);
route.post("/change-password", AuthControllers.changePassword);

export const AuthRouter = route;
