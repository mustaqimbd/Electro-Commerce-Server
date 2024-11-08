import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { AttributeControllers } from "./attribute.controller";
import { AttributeValidation } from "./attribute.validation";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(AttributeValidation.attribute),
  AttributeControllers.createAttribute
);

router.get("/", AttributeControllers.getAllAttributes);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  validateRequest(AttributeValidation.updateAttribute),
  AttributeControllers.updateAttribute
);

router.delete(
  "/",
  authGuard({
    requiredRoles: ["superAdmin", "admin", "staff"],
    requiredPermission: "manage product",
  }),
  AttributeControllers.deleteAttribute
);

export const AttributeRoutes = router;
