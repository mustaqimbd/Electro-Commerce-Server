import { Types } from "mongoose";
import { TBrand } from "./brand.interface";
import { BrandModel } from "./brand.model";
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createBrandIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TBrand
) => {
  payload.createdBy = createdBy;
  const isBrandDeleted = await BrandModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isBrandDeleted) {
    const result = await BrandModel.findByIdAndUpdate(
      isBrandDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await BrandModel.create(payload);
    return result;
  }
};

const getAllBrandsFromDB = async () => {
  const result = await BrandModel.find(
    { isDeleted: false },
    "name description logo"
  );
  return result;
};

const updateBrandIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TBrand
) => {
  payload.createdBy = createdBy;
  const isBrandExist = await BrandModel.findById(id);

  if (!isBrandExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The brand was not found!");
  }

  if (isBrandExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The brand is deleted!");
  }
  const isUpdateBrandDeleted = await BrandModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isUpdateBrandDeleted) {
    const result = await BrandModel.findByIdAndUpdate(
      isUpdateBrandDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    await BrandModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const result = await BrandModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }
};

const deleteBrandFromDB = async (createdBy: Types.ObjectId, id: string) => {
  const isBrandExist = await BrandModel.findById(id);

  if (!isBrandExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The brand was not found!");
  }

  if (isBrandExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The brand is already deleted!");
  }

  const result = await BrandModel.findByIdAndUpdate(id, {
    description: "",
    logo: "",
    createdBy,
    isDeleted: true,
  });
  return result;
};

export const BrandServices = {
  createBrandIntoDB,
  getAllBrandsFromDB,
  updateBrandIntoDB,
  deleteBrandFromDB,
};
