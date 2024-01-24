import express from "express";
import { CategoryControllers } from "./category.controller";
import categoryValidationSchema from "./category.validation";
import validateRequest from "../../../middlewares/validateRequest";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(categoryValidationSchema),
  CategoryControllers.createCategory
);

router.get("/", CategoryControllers.getAllCategories);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(categoryValidationSchema),
  CategoryControllers.updateCategory
);

router.delete(
  "/:id",
  // authGuard('admin'),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
