import { Types } from "mongoose";
import { TReview } from "./review.interface";
import { ReviewModel } from "./review.model";

import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createReviewIntoDB = async (
  customer: Types.ObjectId,
  payload: TReview
) => {
  const isReviewDeleted = await ReviewModel.findOne({
    product: payload.product,
    customer: customer,
    isDeleted: true,
  });

  if (isReviewDeleted) {
    const result = await ReviewModel.findByIdAndUpdate(
      isReviewDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await ReviewModel.create(payload);
    return result;
  }
};

const getAllReviewsFromDB = async () => {
  const result = await ReviewModel.find({ isDeleted: false }, "name");
  return result;
};

const updateReviewIntoDB = async (
  customer: Types.ObjectId,
  id: string,
  payload: TReview
) => {
  payload.customer = customer;

  const isReviewExist = await ReviewModel.findById(id);
  if (!isReviewExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Review was not found!");
  }

  if (isReviewExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Review is deleted!");
  }

  const isUpdateReviewDeleted = await ReviewModel.findOne({
    isDeleted: true,
  });

  if (isUpdateReviewDeleted) {
    const result = await ReviewModel.findByIdAndUpdate(
      isUpdateReviewDeleted._id,
      { customer, isDeleted: false },
      { new: true }
    );
    await ReviewModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const result = await ReviewModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }
};

const deleteReviewIntoDB = async (customer: Types.ObjectId, id: string) => {
  const isReviewExist = await ReviewModel.findById(id);
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
    customer,
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
