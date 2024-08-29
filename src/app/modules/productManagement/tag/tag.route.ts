import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { TagControllers } from "./tag.controller";
import { TagValidation } from "./tag.validation";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(TagValidation.tag),
  TagControllers.createTag
);

router.get("/", TagControllers.getAllTags);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(TagValidation.tag),
  TagControllers.updateTag
);

router.delete(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  TagControllers.deleteTag
);

export const TagRoutes = router;
