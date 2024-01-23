import httpStatus from "http-status";
import successResponse from "../../../../shared/successResponse";
import { categoryServices } from "./category.service";
import catchAsync from "../../../../shared/catchAsync";

const createCategory = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const result = await categoryServices.createCategoryIntoDB(
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
  const result = await categoryServices.getAllCategoriesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const categoryId = req.params.categoryId;
  const result = await categoryServices.updateCategoryIntoDB(
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
  const createdBy = req.user._id;
  const categoryId = req.params.categoryId;
  await categoryServices.deleteCategoryIntoDB(createdBy, categoryId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: null,
  });
});

export const categoryControllers = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
