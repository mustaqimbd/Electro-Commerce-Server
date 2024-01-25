import express from "express";
import { SubCategoryControllers } from "./subCategory.controller";
import {
  subCategoryValidationSchema,
  updateSubCategoryValidationSchema,
} from "./subCategory.validation";
import validateRequest from "../../../middlewares/validateRequest";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(subCategoryValidationSchema),
  SubCategoryControllers.createSubCategory
);

router.get("/", SubCategoryControllers.getAllSubCategories);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(updateSubCategoryValidationSchema),
  SubCategoryControllers.updateSubCategory
);

router.delete(
  "/:id",
  // authGuard('admin'),
  SubCategoryControllers.deleteSubCategory
);

export const SubCategoryRoutes = router;
