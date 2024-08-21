import { Router } from "express";
import config from "../../config/config";
import authGuard from "../../middlewares/authGuard";
import imgUploader from "../../utilities/imgUploader";
import { ImageControllers } from "./image.controller";

const router = Router();

router.post(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  imgUploader.array("images", Number(config.upload_image_maxCount)),
  ImageControllers.createImage
);

router.get(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  ImageControllers.getAnImage
);

router.get(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  ImageControllers.getAllImages
);

router.delete(
  "/",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  ImageControllers.deleteImages
);

export const ImageRoutes = router;
