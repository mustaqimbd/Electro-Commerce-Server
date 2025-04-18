import express from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { SubCategoryControllers } from "./subCategory.controller";
import { SubCategoryValidation } from "./subCategory.validation";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(SubCategoryValidation.subCategory),
  SubCategoryControllers.createSubCategory
);

router.get("/", SubCategoryControllers.getAllSubCategories);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(SubCategoryValidation.updateSubCategory),
  SubCategoryControllers.updateSubCategory
);

router.delete(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  SubCategoryControllers.deleteSubCategory
);
router.get("/:id", SubCategoryControllers.getAllSubCategoriesCategory);

export const SubCategoryRoutes = router;
