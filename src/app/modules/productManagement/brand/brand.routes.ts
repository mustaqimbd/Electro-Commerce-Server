import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { BrandControllers } from "./brand.controller";
import { BrandValidation } from "./brand.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(BrandValidation.brand),
  BrandControllers.createBrand
);

router.get("/", BrandControllers.getAllBrands);

router.patch(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(BrandValidation.updateBrand),
  BrandControllers.updateBrand
);

router.delete(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  BrandControllers.deleteBrand
);

export const BrandRoutes = router;
