import { Types } from "mongoose";
import { TCategory } from "./category.interface";
import { CategoryModel } from "./category.model";
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TCategory
) => {
  payload.createdBy = createdBy;
  const isCategoryDeleted = await CategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isCategoryDeleted) {
    const result = await CategoryModel.findByIdAndUpdate(
      isCategoryDeleted._id,
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
  const pipeline = [
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "images",
        localField: "image",
        foreignField: "_id",
        as: "image",
      },
    },
    { $unwind: { path: "$image", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "category",
        as: "subCategory",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        image: {
          _id: "$image._id",
          src: "$image.src",
          alt: "$image.alt",
          uploadedBy: "$image.uploadedBy",
        },
        description: 1,
        subcategories: {
          $map: {
            input: "$subCategory",
            as: "sub",
            in: {
              _id: "$$sub._id",
              name: "$$sub.name",
            },
          },
        },
      },
    },
  ];
  const result = await CategoryModel.aggregate(pipeline);
  return result;
};

const updateCategoryIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TCategory
) => {
  payload.createdBy = createdBy;
  const isCategoryExist = await CategoryModel.findById(id);

  if (!isCategoryExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  }

  if (isCategoryExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The category is deleted!");
  }
  const isUpdateCategoryDeleted = await CategoryModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isUpdateCategoryDeleted) {
    const result = await CategoryModel.findByIdAndUpdate(
      isUpdateCategoryDeleted._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    await CategoryModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const result = await CategoryModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }
};

const deleteCategoryFromDB = async (
  createdBy: Types.ObjectId,
  categoryIds: string[]
) => {
  // const isCategoryExist = await CategoryModel.findById(id);
  // if (!isCategoryExist) {
  //   throw new ApiError(httpStatus.NOT_FOUND, "The category was not found!");
  // }

  // if (isCategoryExist.isDeleted) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "The category is already deleted!"
  //   );
  // }
  const result = await CategoryModel.updateMany(
    { _id: { $in: categoryIds } },
    {
      $set: {
        createdBy: createdBy,
        isDeleted: true,
      },
    }
  );

  return result;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
