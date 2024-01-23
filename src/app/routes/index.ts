import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { UserRoute } from "../modules/user/user.routes";

const router = express();
const moduleRoutes = [
  {
    path: "/users",
    route: UserRoute,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
