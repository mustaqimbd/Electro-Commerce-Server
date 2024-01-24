import httpStatus from "http-status";
import { CategoryServices } from "./category.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await CategoryServices.createCategoryIntoDB(
    createdBy,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getAllCategoriesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const categoryId = req.params.id;
  const result = await CategoryServices.updateCategoryIntoDB(
    createdBy,
    categoryId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const categoryId = req.params.id;
  await CategoryServices.deleteCategoryIntoDB(createdBy, categoryId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: null,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};