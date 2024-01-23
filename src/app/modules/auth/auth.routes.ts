import express from "express";
import { AuthControllers } from "./auth.controller";

const route = express.Router();

route.post("/login", AuthControllers.login);
route.post("/access-token", AuthControllers.refreshToken);

export const AuthRouter = route;
