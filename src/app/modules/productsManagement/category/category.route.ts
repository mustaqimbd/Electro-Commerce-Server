import express from "express";
import { categoryControllers } from "./category.controller";
import categoryValidationSchema from "./category.validation";
import validateRequest from "../../../middlewares/validateRequest";
// import authGuard from '../../middlewares/authGuard';

const categoryRoutes = express.Router();

categoryRoutes.post(
  "/",
  // authGuard('admin'),
  validateRequest(categoryValidationSchema),
  categoryControllers.createCategory
);

categoryRoutes.get("/", categoryControllers.getAllCategories);

categoryRoutes.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(categoryValidationSchema),
  categoryControllers.updateCategory
);
categoryRoutes.delete(
  "/:id",
  // authGuard('admin'),
  categoryControllers.deleteCategory
);

export default categoryRoutes;
