import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { AttributeRoutes } from "../modules/productsManagement/attribute/attribute.route";
import { BrandRoutes } from "../modules/productsManagement/brand/brand.route";
import { CategoryRoutes } from "../modules/productsManagement/category/category.route";
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
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/brands",
    route: BrandRoutes,
  },
  {
    path: "/attributes",
    route: AttributeRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
