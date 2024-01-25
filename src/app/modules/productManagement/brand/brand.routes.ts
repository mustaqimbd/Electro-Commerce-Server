import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { BrandControllers } from "./brand.controller";
import {
  brandValidationSchema,
  updateBrandValidationSchema,
} from "./brand.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(brandValidationSchema),
  BrandControllers.createBrand
);

router.get("/", BrandControllers.getAllBrands);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(updateBrandValidationSchema),
  BrandControllers.updateBrand
);

router.delete(
  "/:id",
  // authGuard('admin'),
  BrandControllers.deleteBrand
);

export const BrandRoutes = router;
