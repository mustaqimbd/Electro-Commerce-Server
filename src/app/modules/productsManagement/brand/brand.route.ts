import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { brandControllers } from "./brand.controller";
import {
  brandValidationSchema,
  updateBrandValidationSchema,
} from "./brand.validation";
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
  "/:id",
  // authGuard('admin'),
  validateRequest(updateBrandValidationSchema),
  brandControllers.updateBrand
);

brandRoutes.delete(
  "/:id",
  // authGuard('admin'),
  brandControllers.deleteBrand
);

export default brandRoutes;
