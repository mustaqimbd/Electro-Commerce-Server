import express from "express";
import { CategoryControllers } from "./category.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { CategoryValidation } from "./category.validation";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(CategoryValidation.category),
  CategoryControllers.createCategory
);

router.get("/", CategoryControllers.getAllCategories);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(CategoryValidation.updateCategory),
  CategoryControllers.updateCategory
);

router.delete(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;
