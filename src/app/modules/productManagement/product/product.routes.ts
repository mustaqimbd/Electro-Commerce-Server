import express from "express";
import { ProductControllers } from "./product.controller";
import validateRequest from "../../../middlewares/validateRequest";
import { productValidationSchema } from "./product.validation";

// import authGuard from '../../middlewares/authGuard';

const router = express.Router();

router.post(
  "/",
  // authGuard('admin'),
  validateRequest(productValidationSchema),
  ProductControllers.createProduct
);

router.get("/", ProductControllers.getAllProducts);

router.patch(
  "/:id",
  // authGuard('admin'),
  validateRequest(productValidationSchema),
  ProductControllers.updateProduct
);

router.delete(
  "/:id",
  // authGuard('admin'),
  ProductControllers.deleteProduct
);

export const ProductRoutes = router;
