import { Router } from "express";
import optionalAuthGuard from "../../middlewares/optionalAuthGuard";
import validateRequest from "../../middlewares/validateRequest";
import { ImageToOrderImgUploader } from "../../utilities/imgUploader";
import { ImageToOrderController } from "./imageToOrder.controller";
import { ImageToOrderValidate } from "./imageToOrder.validate";

const router = Router();

router.post(
  "/",
  optionalAuthGuard,
  ImageToOrderImgUploader.array("images", 5),
  validateRequest(ImageToOrderValidate.createReq),
  ImageToOrderController.createReq
);

export const ImageToOrderRoutes = router;
