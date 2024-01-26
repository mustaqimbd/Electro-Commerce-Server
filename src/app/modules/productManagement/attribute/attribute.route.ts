import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { AttributeControllers } from "./attribute.controller";
import {
  attributeValidationSchema,
  updateAttributeValidationSchema,
} from "./attribute.validation";
// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(attributeValidationSchema),
  AttributeControllers.createAttribute
);

router.get("/", AttributeControllers.getAllAttributes);

router.patch(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  validateRequest(updateAttributeValidationSchema),
  AttributeControllers.updateAttribute
);

router.delete(
  "/:id",
  // authGuard(ENUM_USER_ROLE.ADMIN),
  AttributeControllers.deleteAttribute
);

export const AttributeRoutes = router;
