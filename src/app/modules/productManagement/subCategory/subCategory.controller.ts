import httpStatus from "http-status";
import { SubCategoryServices } from "./subCategory.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createSubCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await SubCategoryServices.createSubCategoryIntoDB(
    createdBy,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Sub category created successfully",
    data: result,
  });
});

const getAllSubCategories = catchAsync(async (req, res) => {
  const result = await SubCategoryServices.getAllSubCategoriesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sub categories retrieved successfully",
    data: result,
  });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const subCategoryId = req.params.id;
  const result = await SubCategoryServices.updateSubCategoryIntoDB(
    createdBy,
    subCategoryId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sub category updated successfully",
    data: result,
  });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const subCategoryId = req.params.id;
  await SubCategoryServices.deleteSubCategoryFromDB(createdBy, subCategoryId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Sub category deleted successfully",
    data: null,
  });
});

export const SubCategoryControllers = {
  createSubCategory,
  getAllSubCategories,
  updateSubCategory,
  deleteSubCategory,
};
