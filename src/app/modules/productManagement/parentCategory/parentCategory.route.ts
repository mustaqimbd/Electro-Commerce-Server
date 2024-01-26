import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { ParentCategoryControllers } from "./parentCategory.controller";
import parentCategoryValidationSchema from "./parentCategory.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(parentCategoryValidationSchema),
  ParentCategoryControllers.createParentCategory
);

router.get("/", ParentCategoryControllers.getAllParentCategories);

router.patch(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(parentCategoryValidationSchema),
  ParentCategoryControllers.updateParentCategory
);

router.delete(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  ParentCategoryControllers.deleteParentCategory
);

export const ParentCategoryRoutes = router;
