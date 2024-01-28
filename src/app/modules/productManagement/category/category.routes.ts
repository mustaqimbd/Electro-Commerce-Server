import express from "express";
import { CategoryControllers } from "./category.controller";
import validateRequest from "../../../middlewares/validateRequest";
import categoryValidationSchema from "./category.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
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
  // authGuard(ENUM_USER_ROLE.ADMIN),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
