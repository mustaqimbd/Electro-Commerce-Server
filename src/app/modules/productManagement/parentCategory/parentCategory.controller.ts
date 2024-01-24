import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ParentCategoryServices } from "./parentCategory.service";

const createParentCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await ParentCategoryServices.createParentCategoryIntoDB(
    createdBy,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Parent category created successfully",
    data: result,
  });
});

const getAllParentCategories = catchAsync(async (req, res) => {
  const result = await ParentCategoryServices.getAllParentCategoriesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Parent categories retrieved successfully",
    data: result,
  });
});

const updateParentCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const ParentCategoryId = req.params.id;
  const result = await ParentCategoryServices.updateParentCategoryIntoDB(
    createdBy,
    ParentCategoryId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Parent category updated successfully",
    data: result,
  });
});

const deleteParentCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const ParentCategoryId = req.params.id;
  await ParentCategoryServices.deleteParentCategoryIntoDB(
    createdBy,
    ParentCategoryId
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Parent category deleted successfully",
    data: null,
  });
});

export const ParentCategoryControllers = {
  createParentCategory,
  getAllParentCategories,
  updateParentCategory,
  deleteParentCategory,
};
