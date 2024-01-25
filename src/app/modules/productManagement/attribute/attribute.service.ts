import { Types } from "mongoose";
import { TAttribute } from "./attribute.interface";
import { AttributeModel } from "./attribute.model";
import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createAttributeIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TAttribute
) => {
  payload.createdBy = createdBy;
  const isAttributeDeleted = await AttributeModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isAttributeDeleted) {
    const result = await AttributeModel.findByIdAndUpdate(
      isAttributeDeleted._id,
      { ...payload, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await AttributeModel.create(payload);
    return result;
  }
};

const getAllAttributesFromDB = async () => {
  const result = await AttributeModel.find({ isDeleted: false }, "name values");
  return result;
};

const updateAttributeIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TAttribute
) => {
  payload.createdBy = createdBy;
  const { deleteValue } = payload;
  const isAttributeExist = await AttributeModel.findById(id);

  if (!isAttributeExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The attribute was not found!");
  }
  if (isAttributeExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The attribute is deleted!");
  }

  if (deleteValue) {
    const result = await AttributeModel.findByIdAndUpdate(
      id,
      { $pull: { values: deleteValue } },
      { new: true }
    );
    return result;
  }

  const isUpdateAttributeDeleted = await AttributeModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  const { name, values } = payload;

  if (isUpdateAttributeDeleted) {
    const updateData = values
      ? payload
      : { name, values: [...isAttributeExist.values] };
    const result = await AttributeModel.findByIdAndUpdate(
      isUpdateAttributeDeleted._id,
      { ...updateData, isDeleted: false },
      { new: true }
    );
    await AttributeModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const updateValues = values ? values : [];
    payload.values = [
      ...new Set([...isAttributeExist.values, ...updateValues]),
    ];
    const result = await AttributeModel.findByIdAndUpdate(id, payload, {
      new: true,
    });

    return result;
  }
};

const deleteAttributeFromDB = async (createdBy: Types.ObjectId, id: string) => {
  const isAttributeExist = await AttributeModel.findById(id);

  if (!isAttributeExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The attribute was not found!");
  }
  if (isAttributeExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The attribute is already deleted!"
    );
  }

  const result = await AttributeModel.findByIdAndUpdate(id, {
    values: [],
    createdBy,
    isDeleted: true,
  });
  return result;
};

export const AttributeServices = {
  createAttributeIntoDB,
  getAllAttributesFromDB,
  updateAttributeIntoDB,
  deleteAttributeFromDB,
};
