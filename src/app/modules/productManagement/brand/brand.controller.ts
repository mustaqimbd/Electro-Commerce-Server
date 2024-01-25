import httpStatus from "http-status";
import { BrandServices } from "./brand.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createBrand = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await BrandServices.createBrandIntoDB(createdBy, req.body);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Brand created successfully",
    data: result,
  });
});

const getAllBrands = catchAsync(async (req, res) => {
  const result = await BrandServices.getAllBrandsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brands retrieved successfully",
    data: result,
  });
});

const updateBrand = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const brandId = req.params.id;
  const result = await BrandServices.updateBrandIntoDB(
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
  const createdBy = req.user.id;
  const brandId = req.params.id;
  await BrandServices.deleteBrandFromDB(createdBy, brandId);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Brand deleted successfully",
    data: null,
  });
});

export const BrandControllers = {
  createBrand,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
