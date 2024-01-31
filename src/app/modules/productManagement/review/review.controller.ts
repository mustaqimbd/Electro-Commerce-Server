import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ReviewServices } from "./review.service";

const createReview = catchAsync(async (req, res) => {
  const product = req.params.id;
  const customer = req.user.id;
  const result = await ReviewServices.createReviewIntoDB(
    product,
    customer,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req, res) => {
  const product = req.params.id;
  const result = await ReviewServices.getAllReviewsFromDB(product);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const customer = req.user.id;
  const ReviewId = req.params.id;
  const result = await ReviewServices.updateReviewIntoDB(
    customer,
    ReviewId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Review  updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  const customer = req.user.id;
  const ReviewId = req.params.id;
  await ReviewServices.deleteReviewIntoDB(customer, ReviewId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Review deleted successfully",
    data: null,
  });
});

export const ReviewControllers = {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
};
