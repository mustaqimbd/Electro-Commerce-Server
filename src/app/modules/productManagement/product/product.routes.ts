import express from "express";
import { ProductControllers } from "./product.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { ProductValidation } from "./product.validation";
import imgUploader from "../../../utilities/imgUploader";
import formDataParse from "../../../utilities/formDataParse";

// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  imgUploader.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 5 },
  ]),
  formDataParse,
  validateRequest(ProductValidation.product),
  ProductControllers.createProduct
);

router.get("/", ProductControllers.getAllProducts);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(ProductValidation.product),
  ProductControllers.updateProduct
);

router.delete(
  "/:id",
  // authGuard('admin'),
  ProductControllers.deleteProduct
);

export const ProductRoutes = router;
