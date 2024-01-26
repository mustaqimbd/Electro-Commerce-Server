import express from "express";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AuthRouters } from "../modules/auth/auth.routes";
import { CustomerRoutes } from "../modules/customer/customer.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.route";
import { BrandRoutes } from "../modules/productManagement/brand/brand.route";
import { CategoryRoutes } from "../modules/productManagement/category/category.route";
import { ParentCategoryRoutes } from "../modules/productManagement/parentCategory/parentCategory.route";
import { UserRoutes } from "../modules/user/user.routes";

const router = express();
const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/customers",
    route: CustomerRoutes,
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
