import httpStatus from "http-status";
import { brandServices } from "./brand.service";
import catchAsync from "../../../shared/catchAsync";
import successResponse from "../../../shared/successResponse";

const createBrand = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const result = await brandServices.createBrandIntoDB(createdBy, req.body);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Brand created successfully",
    data: result,
  });
});

const getAllBrands = catchAsync(async (req, res) => {
  const result = await brandServices.getAllBrandsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brands retrieved successfully",
    data: result,
  });
});

const updateBrand = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const brandId = req.params.id;
  const result = await brandServices.updateBrandIntoDB(
    createdBy,
    brandId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brand updated successfully",
    data: result,
  });
});

const deleteBrand = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const brandId = req.params.id;
  await brandServices.deleteBrandIntoDB(createdBy, brandId);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brand deleted successfully",
    data: null,
  });
});

export const brandControllers = {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
