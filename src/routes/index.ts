import express from "express";
import { UsersRoute } from "../app/modules/users/users.routes";

const router = express();
const moduleRoutes = [
  {
    path: "/users",
    route: UsersRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
