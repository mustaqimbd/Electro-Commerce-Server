import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.route";
import { BrandRoutes } from "../modules/productManagement/brand/brand.route";
import { CategoryRoutes } from "../modules/productManagement/category/category.route";
import { UserRoute } from "../modules/user/user.routes";
import { ParentCategoryRoutes } from "../modules/productManagement/parentCategory/parentCategory.route";

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
    path: "/parent-categories",
    route: ParentCategoryRoutes,
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
