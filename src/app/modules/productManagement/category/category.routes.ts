import express from "express";
import { CategoryControllers } from "./category.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { CategoryValidation } from "./category.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(CategoryValidation.category),
  CategoryControllers.createCategory
);

router.get("/", CategoryControllers.getAllCategories);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(CategoryValidation.category),
  CategoryControllers.updateCategory
);

router.delete(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
