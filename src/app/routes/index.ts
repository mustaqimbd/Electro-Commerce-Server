import express, { Router } from "express";
import { AuthRouters } from "../modules/authManagement/auth/auth.routes";
import { CartRoutes } from "../modules/cartManagement/cart/cart.routes";
import { CouponRoutes } from "../modules/coupon/coupon.routes";
import { CourierRoutes } from "../modules/courier/courier.routes";
import { ImageRoutes } from "../modules/image/image.routes";
import { ImageToOrderRoutes } from "../modules/imageToOrder/imageToOrder.routes";
import { OrderRoutes } from "../modules/orderManagement/order/order.routes";
import { ShippingChargeRoutes } from "../modules/orderManagement/shippingCharge/shippingCharge.routes";
import { paymentMethodRoutes } from "../modules/paymentMethod/paymentMethod.routes";
import { AttributeRoutes } from "../modules/productManagement/attribute/attribute.routes";
import { BrandRoutes } from "../modules/productManagement/brand/brand.routes";
import { CategoryRoutes } from "../modules/productManagement/category/category.routes";
import { ProductRoutes } from "../modules/productManagement/product/product.routes";
import { ReviewRoutes } from "../modules/productManagement/review/review.route";
import { SubCategoryRoutes } from "../modules/productManagement/subCategory/subCategory.routes";
import { TagRoutes } from "../modules/productManagement/tag/tag.route";
import { ReportsRoutes } from "../modules/reports/reports.routes";
import { SliderBannerRoutes } from "../modules/themeOption/sliderSection/sliderSection.routes";
import { AdminRoutes } from "../modules/userManagement/admin/admin.routes";
import { CustomerRoutes } from "../modules/userManagement/customer/customer.routes";
import { PermissionRoutes } from "../modules/userManagement/permission/permission.routes";
import { UserRoutes } from "../modules/userManagement/user/user.routes";
import { WarrantyRoutes } from "../modules/warrantyManagement/warranty/warranty.routes";
import { WarrantyClaimRoutes } from "../modules/warrantyManagement/warrantyClaim/warrantyClaim.routes";

type TModuleTypes = {
  path: string;
  route: Router;
};

const router = express();

const moduleRoutes: TModuleTypes[] = [
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
  {
    path: "/reports",
    route: ReportsRoutes,
  },
  {
    path: "/coupons",
    route: CouponRoutes,
  },
  {
    path: "/image-to-order",
    route: ImageToOrderRoutes,
  },
  {
    path: "/slider-banner",
    route: SliderBannerRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
