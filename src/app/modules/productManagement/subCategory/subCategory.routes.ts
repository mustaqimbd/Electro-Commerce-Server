import express from "express";
import { SubCategoryControllers } from "./subCategory.controller";
import { SubCategoryValidation } from "./subCategory.validation";
import validateRequest from "../../../middlewares/validateRequest";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(SubCategoryValidation.subCategory),
  SubCategoryControllers.createSubCategory
);

router.get("/", SubCategoryControllers.getAllSubCategories);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(SubCategoryValidation.updateSubCategory),
  SubCategoryControllers.updateSubCategory
);

router.delete(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  SubCategoryControllers.deleteSubCategory
);

export const SubCategoryRoutes = router;
