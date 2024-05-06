import { Router } from "express";
import config from "../../../config/config";
import authGuard from "../../../middlewares/authGuard";
import validateRequest from "../../../middlewares/validateRequest";
import { imageAndVideoUploader } from "../../../utilities/imgUploader";
import { WarrantyClaimController } from "./warrantyClaim.controller";
import { WarrantyClaimMiddlewares } from "./warrantyClaim.middlewares";
import { WarrantyClaimValidation } from "./warrantyClaim.validate";

const router = Router();

router.get(
  "/",
  // authGuard({ requiredRoles: ["admin", "staff"] }),
  WarrantyClaimController.getAllWarrantyClaimReq
);

router.get(
  "/check-warranty",
  validateRequest(WarrantyClaimValidation.checkWarranty),
  WarrantyClaimController.checkWarranty
);

router.post(
  "/",
  imageAndVideoUploader.array("files", Number(config.upload_image_maxCount)),
  WarrantyClaimMiddlewares.parseFormData,
  validateRequest(WarrantyClaimValidation.createWarrantyClaimReq),
  WarrantyClaimMiddlewares.validateWarranty,
  WarrantyClaimController.createWarrantyClaimReq
);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["admin", "staff"] }),
  validateRequest(WarrantyClaimValidation.updateWarrantyClaimReq),
  WarrantyClaimController.updateWarrantyClaimReq
);

export const WarrantyClaimRoutes = router;
