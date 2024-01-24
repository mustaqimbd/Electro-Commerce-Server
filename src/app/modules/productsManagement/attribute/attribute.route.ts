import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { attributeControllers } from "./attribute.controller";
import {
  attributeValidationSchema,
  updateAttributeValidationSchema,
} from "./attribute.validation";
// import authGuard from '../../middlewares/authGuard';

const attributeRoutes = express.Router();

attributeRoutes.post(
  "/",
  // authGuard('admin'),
  validateRequest(attributeValidationSchema),
  attributeControllers.createAttribute
);

attributeRoutes.get("/", attributeControllers.getAllAttributes);

attributeRoutes.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(updateAttributeValidationSchema),
  attributeControllers.updateAttribute
);

attributeRoutes.delete(
  "/:id",
  // authGuard('admin'),
  attributeControllers.deleteAttribute
);

export default attributeRoutes;
