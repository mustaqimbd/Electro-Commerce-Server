import express from "express";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { SubCategoryRoutes } from "../modules/productManagement/subCategory/subCategory.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";
import { AdminRoutes } from "../modules/admin/admin.routes";
import { AuthRouters } from "../modules/auth/auth.routes";
import { CustomerRoutes } from "../modules/customer/customer.routes";
import { CartRoutes } from "../modules/shoppingCartManagement/cart/cart.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { ReviewRoutes } from "../modules/productManagement/review/review.route";

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
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/carts",
    route: CartRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
