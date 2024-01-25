import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { TagControllers } from "./tag.controller";
import tagValidationSchema from "./tag.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(tagValidationSchema),
  TagControllers.createTag
);

router.get("/", TagControllers.getAllTags);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(tagValidationSchema),
  TagControllers.updateTag
);

router.delete(
  "/:id",
  // authGuard('admin'),
  TagControllers.deleteTag
);

export const TagRoutes = router;
