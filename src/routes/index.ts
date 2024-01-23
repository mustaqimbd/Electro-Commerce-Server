import express from "express";
import { UsersRoute } from "../app/modules/users/users.routes";
import categoryRoutes from "../app/modules/productsManagement/category/category.route";
import brandRoutes from "../app/modules/productsManagement/brand/brand.route";

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
  {
    path: "/brands",
    route: brandRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
