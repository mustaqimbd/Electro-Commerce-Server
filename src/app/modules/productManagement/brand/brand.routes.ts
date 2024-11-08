import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { BrandControllers } from "./brand.controller";
import { BrandValidation } from "./brand.validation";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(BrandValidation.brand),
  BrandControllers.createBrand
);

router.get("/", BrandControllers.getAllBrands);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(BrandValidation.updateBrand),
  BrandControllers.updateBrand
);

router.delete(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  BrandControllers.deleteBrand
);

export const BrandRoutes = router;
