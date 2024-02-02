import { Types } from "mongoose";
import { TReview } from "./review.interface";
import { ReviewModel } from "./review.model";

import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import ProductModel from "../product/product.model";

const createReviewIntoDB = async (
  product: string,
  customer: Types.ObjectId,
  payload: Partial<TReview>
) => {
  const isProductExist = await ProductModel.findById(product);
  if (!isProductExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Product was not found!");
  }
  if (isProductExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Product is deleted!");
  }
  if (!isProductExist.review) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Product is not allowed to review!"
    );
  }
  const isReviewExist = await ReviewModel.findOne({
    product,
    customer,
  });

  if (isReviewExist?.isDeleted) {
    const result = await ReviewModel.findByIdAndUpdate(
      isReviewExist?._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else if (isReviewExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You already reviewed in this product!"
    );
  } else {
    const result = await ReviewModel.create({ product, customer, ...payload });
    return result;
  }
};

const getAllReviewsFromDB = async (product: string) => {
  const result = await ReviewModel.find({ product, isDeleted: false }).populate(
    [
      { path: "product", select: "title" },
      { path: "customer", select: "-createdAt -updatedAt" },
    ]
  );
  return result;
};

const updateReviewIntoDB = async (
  customer: Types.ObjectId,
  reviewId: string,
  payload: TReview
) => {
  const isReviewExist = await ReviewModel.findOne({ customer, _id: reviewId });
  if (!isReviewExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Review was not found!");
  }

  if (isReviewExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Review is deleted!");
  }

  const isUpdateReviewDeleted = await ReviewModel.findOne({
    product: isReviewExist.product,
    customer: isReviewExist.customer,
    isDeleted: true,
  });

  if (isUpdateReviewDeleted) {
    const result = await ReviewModel.findByIdAndUpdate(
      isUpdateReviewDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await ReviewModel.findByIdAndUpdate(reviewId, payload, {
      new: true,
    });
    return result;
  }
};

const deleteReviewIntoDB = async (customer: Types.ObjectId, id: string) => {
  const isReviewExist = await ReviewModel.findOne({ customer, _id: id });
  if (!isReviewExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Review was not found!");
  }

  if (isReviewExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Review is already deleted!"
    );
  }

  const result = await ReviewModel.findByIdAndUpdate(id, {
    isDeleted: true,
  });

  return result;
};

export const ReviewServices = {
  createReviewIntoDB,
  getAllReviewsFromDB,
  updateReviewIntoDB,
  deleteReviewIntoDB,
};
