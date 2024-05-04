import { Router } from "express";
import config from "../../../config/config";
import validateRequest from "../../../middlewares/validateRequest";
import { imageAndVideoUploader } from "../../../utilities/imgUploader";
import { WarrantyClaimController } from "./warrantyClaim.controller";
import { WarrantyClaimMiddlewares } from "./warrantyClaim.middlewares";
import { ClaimWarrantyValidation } from "./warrantyClaim.validate";

const router = Router();

router.get(
  "/check-warranty",
  validateRequest(ClaimWarrantyValidation.checkWarranty),
  WarrantyClaimController.checkWarranty
);

router.post(
  "/",
  imageAndVideoUploader.array("files", Number(config.upload_image_maxCount)),
  WarrantyClaimMiddlewares.parseFormData,
  validateRequest(ClaimWarrantyValidation.createWarrantyClaimReq),
  WarrantyClaimMiddlewares.validateWarranty,
  WarrantyClaimController.createWarrantyClaimReq
);

export const WarrantyClaimRoutes = router;
