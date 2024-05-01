import { Router } from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { WarrantyController } from "./warranty.controller";
import { ValidateWarranty } from "./warranty.validation";

const router = Router();

router.post(
  "/",
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.createWarranty
);

router.patch(
  "/",
  validateRequest(ValidateWarranty.createWarranty),
  WarrantyController.updateWarranty
);

export const WarrantyRoutes = router;
