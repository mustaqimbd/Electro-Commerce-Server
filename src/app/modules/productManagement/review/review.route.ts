import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { ReviewControllers } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

router.post(
  "/:id",
  validateRequest(ReviewValidation.review),
  ReviewControllers.createReview
);

router.get("/:id", ReviewControllers.getAllReviews);

router.patch(
  "/:id",
  validateRequest(ReviewValidation.review),
  ReviewControllers.updateReview
);

router.delete("/:id", ReviewControllers.deleteReview);

export const ReviewRoutes = router;
