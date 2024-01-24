import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { UsersRoute } from "../modules/user/user.routes";
import attributeRoutes from "../modules/productsManagement/attribute/attribute.route";
import brandRoutes from "../modules/productsManagement/brand/brand.route";
import categoryRoutes from "../modules/productsManagement/category/category.route";

const router = express();
const moduleRoutes = [
  {
    path: "/users",
    route: UsersRoute,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/categories",
    route: categoryRoutes,
  },
  {
    path: "/brands",
    route: brandRoutes,
  },
  {
    path: "/attributes",
    route: attributeRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
