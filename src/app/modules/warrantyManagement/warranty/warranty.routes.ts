import { Router } from "express";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { WarrantyController } from "./warranty.controller";
import { ValidateWarranty } from "./warranty.validation";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.createWarranty
);

router.patch(
  "/",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.updateWarranty
);

export const WarrantyRoutes = router;
