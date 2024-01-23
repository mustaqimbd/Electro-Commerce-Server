import { Types } from "mongoose";
import { TAttribute } from "./attribute.interface";
import { BrandModel } from "./attribute.model";

const createBrandIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TAttribute
) => {
  payload.createdBy = createdBy;
  const isBrandExist = await BrandModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isBrandExist) {
    const result = await BrandModel.findByIdAndUpdate(
      isBrandExist._id,
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
  const result = await BrandModel.find({ isDeleted: false });
  return result;
};

const updateBrandIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TAttribute
) => {
  payload.createdBy = createdBy;
  const result = await BrandModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

const deleteBrandIntoDB = async (createdBy: Types.ObjectId, id: string) => {
  const result = await BrandModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });
  return result;
};

export const brandServices = {
  createBrandIntoDB,
  getAllBrandsFromDB,
  updateBrandIntoDB,
  deleteBrandIntoDB,
};
