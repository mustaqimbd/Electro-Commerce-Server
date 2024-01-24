import { Types } from "mongoose";
import { ParentCategoryModel } from "./parentCategory.model";
import { TParentCategory } from "./parentCategory.interface";

import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createParentCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TParentCategory
) => {
  payload.createdBy = createdBy;
  const isParentCategoryExist = await ParentCategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isParentCategoryExist) {
    const result = await ParentCategoryModel.findByIdAndUpdate(
      isParentCategoryExist._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await ParentCategoryModel.create(payload);
    return result;
  }
};

const getAllParentCategoriesFromDB = async () => {
  const result = await ParentCategoryModel.find({ isDeleted: false }, "name");
  return result;
};

const updateParentCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TParentCategory
) => {
  payload.createdBy = createdBy;

  const isParentCategoryExist = await ParentCategoryModel.findById(id);
  if (!isParentCategoryExist) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "The Parent category was not found!"
    );
  }

  if (isParentCategoryExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Parent category is deleted!"
    );
  }

  const result = await ParentCategoryModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteParentCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  id: string
) => {
  const isParentCategoryExist = await ParentCategoryModel.findById(id);
  if (!isParentCategoryExist) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "The Parent category was not found!"
    );
  }

  if (isParentCategoryExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Parent category is already deleted!"
    );
  }

  const result = await ParentCategoryModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });

  return result;
};

export const ParentCategoryServices = {
  createParentCategoryIntoDB,
  getAllParentCategoriesFromDB,
  updateParentCategoryIntoDB,
  deleteParentCategoryIntoDB,
};
