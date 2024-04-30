import express from "express";
import { AuthRouters } from "../modules/authManagement/auth/auth.routes";
import { CourierRoutes } from "../modules/courier/courier.routes";
import { OrderRoutes } from "../modules/orderManagement/order/order.routes";
import { ShippingChargeRoutes } from "../modules/orderManagement/shippingCharge/shippingCharge.routes";
import { paymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { ImageRoutes } from "../modules/productManagement/image/image.routes";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";
import { ReviewRoutes } from "../modules/productManagement/review/review.route";
import { SubCategoryRoutes } from "../modules/productManagement/subCategory/subCategory.routes";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { CartRoutes } from "../modules/shoppingCartManagement/cart/cart.routes";
import { AdminRoutes } from "../modules/userManagement/admin/admin.routes";
import { CustomerRoutes } from "../modules/userManagement/customer/customer.routes";
import { PermissionRoutes } from "../modules/userManagement/permission/permission.routes";
import { UserRoutes } from "../modules/userManagement/user/user.routes";
import { WarrantyRoutes } from "../modules/warrantyManagement/warranty/warranty.routes";
import { WarrantyClaimRoutes } from "../modules/warrantyManagement/warrantyClaim/warrantyClaim.routes";

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
    path: "/images",
    route: ImageRoutes,
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
  {
    path: "/permissions",
    route: PermissionRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/shipping-charges",
    route: ShippingChargeRoutes,
  },
  {
    path: "/payment-method",
    route: paymentMethodRoutes,
  },
  {
    path: "/warranty",
    route: WarrantyRoutes,
  },
  {
    path: "/courier",
    route: CourierRoutes,
  },
  {
    path: "/warranty-claim",
    route: WarrantyClaimRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
