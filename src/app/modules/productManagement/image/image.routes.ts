import { Router } from "express";
import { ImageControllers } from "./image.controller";
import imgUploader from "../../../utilities/imgUploader";

const router = Router();

router.post(
  "/",
  // authGuard('admin'),
  imgUploader.array("images", 10),
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
