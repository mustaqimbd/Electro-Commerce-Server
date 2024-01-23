import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { brandControllers } from "./brands.controller";
import brandValidationSchema from "./brands.validation";
// import authGuard from '../../middlewares/authGuard';

const brandRoutes = express.Router();

brandRoutes.post(
  "/",
  // authGuard('admin'),
  validateRequest(brandValidationSchema),
  brandControllers.createBrand
);

brandRoutes.get("/", brandControllers.getAllBrands);

brandRoutes.patch(
  "/:brandId",
  // authGuard('admin'),
  validateRequest(brandValidationSchema),
  brandControllers.updateBrand
);

brandRoutes.delete(
  "/:brandId",
  // authGuard('admin'),
  brandControllers.deleteBrand
);

export default brandRoutes;
