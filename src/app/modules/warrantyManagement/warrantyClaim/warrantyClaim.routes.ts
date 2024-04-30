import { Router } from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { WarrantyClaimController } from "./warrantyClaim.controller";
import { ClaimWarrantyValidation } from "./warrantyClaim.validation";

const router = Router();

router.get(
  "/check-warranty",
  validateRequest(ClaimWarrantyValidation.checkWarranty),
  WarrantyClaimController.updateWarranty
);

export const WarrantyClaimRoutes = router;
