import { Router } from "express";
import { ImageControllers } from "./image.controller";
import imgUploader from "../../../utilities/imgUploader";
import config from "../../../config/config";
import authGuard from "../../../middlewares/authGuard";

const router = Router();

router.post(
  "/",
  authGuard({
    requiredRoles: ["admin", "customer", "staff"],
  }),
  imgUploader.array("images", Number(config.upload_image_maxCount)),
  ImageControllers.createImage
);

router.get(
  "/:id",
  // authGuard('admin'),
  ImageControllers.getAnImage
);

router.get(
  "/",
  // authGuard('admin'),
  ImageControllers.getAllImages
);

router.delete(
  "/",
  // authGuard('admin'),
  ImageControllers.deleteImages
);

export const ImageRoutes = router;
