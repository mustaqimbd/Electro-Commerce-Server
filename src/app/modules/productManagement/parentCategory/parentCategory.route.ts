import express from "express";
import { ParentCategoryControllers } from "./parentCategory.controller";
import validateRequest from "../../../middlewares/validateRequest";
import parentCategoryValidationSchema from "./parentCategory.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(parentCategoryValidationSchema),
  ParentCategoryControllers.createParentCategory
);

router.get("/", ParentCategoryControllers.getAllParentCategories);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(parentCategoryValidationSchema),
  ParentCategoryControllers.updateParentCategory
);

router.delete(
  "/:id",
  // authGuard('admin'),
  ParentCategoryControllers.deleteParentCategory
);

export const ParentCategoryRoutes = router;
