import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { brandControllers } from "./attribute.controller";
import attributeValidationSchema from "./attribute.validation";
// import authGuard from '../../middlewares/authGuard';

const brandRoutes = express.Router();

brandRoutes.post(
  "/",
  // authGuard('admin'),
  validateRequest(attributeValidationSchema),
  brandControllers.createBrand
);

brandRoutes.get("/", brandControllers.getAllBrands);

brandRoutes.patch(
  "/:brandId",
  // authGuard('admin'),
  validateRequest(attributeValidationSchema),
  brandControllers.updateBrand
);

brandRoutes.delete(
  "/:brandId",
  // authGuard('admin'),
  brandControllers.deleteBrand
);

export default brandRoutes;
