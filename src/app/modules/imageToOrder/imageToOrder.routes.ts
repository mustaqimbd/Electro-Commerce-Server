import { Router } from "express";
import authGuard from "../../middlewares/authGuard";
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

router.get(
  "/",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage image to order",
  }),
  ImageToOrderController.getAllReqAdmin
);

router.patch(
  "/:id",
  authGuard({
    requiredRoles: ["admin", "staff"],
    requiredPermission: "manage image to order",
  }),
  validateRequest(ImageToOrderValidate.updateRequest),
  ImageToOrderController.updateReqByAdmin
);

export const ImageToOrderRoutes = router;
