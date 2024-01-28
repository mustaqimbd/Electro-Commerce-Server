import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { SubCategoryRoutes } from "../modules/productManagement/subCategory/subCategory.routes";
import { UserRoute } from "../modules/user/user.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { CustomerRoute } from "../modules/customer/customer.routes";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";

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
    path: "/customers",
    route: CustomerRoute,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/sub-categories",
    route: SubCategoryRoutes,
  },
  {
    path: "/brands",
    route: BrandRoutes,
  },
  {
    path: "/tags",
    route: TagRoutes,
  },
  {
    path: "/attributes",
    route: AttributeRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
