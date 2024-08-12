import httpStatus from "http-status";
import { SubCategoryServices } from "./subCategory.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import generateSlug from "../../../utilities/generateSlug";

const createSubCategory = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const { name } = req.body;
  req.body.slug = generateSlug(name);
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
  const updatedBy = req.user.id;
  const subCategoryId = req.params.id;
  const { name } = req.body;
  if (name) {
    req.body.slug = generateSlug(name);
  }
  const result = await SubCategoryServices.updateSubCategoryIntoDB(
    updatedBy,
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
  const deletedBy = req.user.id;
  const { subCategoryIds } = req.body;
  await SubCategoryServices.deleteSubCategoryFromDB(deletedBy, subCategoryIds);

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
