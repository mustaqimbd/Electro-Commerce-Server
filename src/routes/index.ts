import express from "express";
import { UsersRoute } from "../app/modules/users/users.routes";
import categoryRoutes from "../app/modules/productsManagement/categories/categories.route";

const router = express();
const moduleRoutes = [
  {
    path: "/users",
    route: UsersRoute,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
