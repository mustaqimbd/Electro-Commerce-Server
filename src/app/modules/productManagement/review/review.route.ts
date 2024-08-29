import express from "express";
import validateRequest from "../../../middlewares/validateRequest";
import { ReviewControllers } from "./review.controller";
import { ReviewValidation } from "./review.validation";
import authGuard from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(ReviewValidation.review),
  ReviewControllers.createReview
);

router.get("/:id", ReviewControllers.getAllReviews);

router.patch(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  validateRequest(ReviewValidation.review),
  ReviewControllers.updateReview
);

router.delete(
  "/:id",
  authGuard({ requiredRoles: ["superAdmin", "admin"] }),
  ReviewControllers.deleteReview
);

export const ReviewRoutes = router;
