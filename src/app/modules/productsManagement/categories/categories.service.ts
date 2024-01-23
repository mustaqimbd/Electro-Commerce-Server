import { Types } from "mongoose";
import { TCategory } from "./categories.interface";
import { CategoryModel } from "./categories.model";

const createCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCategory
) => {
  payload.createdBy = createdBy;
  const isCategoryExist = await CategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isCategoryExist) {
    const result = await CategoryModel.findByIdAndUpdate(
      isCategoryExist._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await CategoryModel.create(payload);
    return result;
  }
};

const getAllCategoriesFromDB = async () => {
  const result = await CategoryModel.find({ isDeleted: false });
  return result;
};

const updateCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TCategory
) => {
  payload.createdBy = createdBy;
  const result = await CategoryModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

const deleteCategoryIntoDB = async (createdBy: Types.ObjectId, id: string) => {
  const result = await CategoryModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });

  return result;
};

export const categoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  updateCategoryIntoDB,
  deleteCategoryIntoDB,
};
