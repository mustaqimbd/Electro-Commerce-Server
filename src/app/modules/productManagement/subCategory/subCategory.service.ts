import { Types } from "mongoose";
import { SubCategoryModel } from "./subCategory.model";
import { TSubCategory } from "./subCategory.interface";
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";
import { CategoryModel } from "../category/category.model";

const createSubCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TSubCategory
) => {
  payload.createdBy = createdBy;
  const isCategoryExist = await CategoryModel.findById(payload.category);

  if (!isCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  }

  if (isCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The category is deleted!");
  }

  const isSubCategoryDeleted = await SubCategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isSubCategoryDeleted) {
    const result = await SubCategoryModel.findByIdAndUpdate(
      isSubCategoryDeleted._id,
      { createdBy, category: payload.category, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await SubCategoryModel.create(payload);
    return result;
  }
};

const getAllSubCategoriesFromDB = async () => {
  const result = await SubCategoryModel.find(
    { isDeleted: false },
    "name"
  ).populate("category", "name");
  return result;
};

const updateSubCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TSubCategory
) => {
  payload.createdBy = createdBy;

  const isSubCategoryExist = await SubCategoryModel.findById(id);
  if (!isSubCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The sub category was not found!");
  }

  if (isSubCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The sub category is deleted!");
  }

  const isUpdateSubCategoryDeleted = await SubCategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isUpdateSubCategoryDeleted) {
    const result = await SubCategoryModel.findByIdAndUpdate(
      isUpdateSubCategoryDeleted._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    await SubCategoryModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const result = await SubCategoryModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }
};

const deleteSubCategoryFromDB = async (
  createdBy: Types.ObjectId,
  id: string
) => {
  const isSubCategoryExist = await SubCategoryModel.findById(id);
  if (!isSubCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The sub category was not found!");
  }

  if (isSubCategoryExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The sub category is already deleted!"
    );
  }

  const result = await SubCategoryModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });

  return result;
};

export const SubCategoryServices = {
  createSubCategoryIntoDB,
  getAllSubCategoriesFromDB,
  updateSubCategoryIntoDB,
  deleteSubCategoryFromDB,
};
