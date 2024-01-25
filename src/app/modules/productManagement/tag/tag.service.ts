import { Types } from "mongoose";
import { TagModel } from "./tag.model";
import { TTag } from "./tag.interface";

import httpStatus from "http-status";
import ApiError from "../../../errorHandlers/ApiError";

const createTagIntoDB = async (createdBy: Types.ObjectId, payload: TTag) => {
  payload.createdBy = createdBy;
  const isTagExist = await TagModel.findOne({
    name: payload.name,
    isDeleted: true,
  });

  if (isTagExist) {
    const result = await TagModel.findByIdAndUpdate(
      isTagExist._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    return result;
  } else {
    const result = await TagModel.create(payload);
    return result;
  }
};

const getAllTagsFromDB = async () => {
  const result = await TagModel.find({ isDeleted: false }, "name");
  return result;
};

const updateTagIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TTag
) => {
  payload.createdBy = createdBy;

  const isTagExist = await TagModel.findById(id);
  if (!isTagExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Tag was not found!");
  }

  if (isTagExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Tag is deleted!");
  }

  const result = await TagModel.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteTagIntoDB = async (createdBy: Types.ObjectId, id: string) => {
  const isTagExist = await TagModel.findById(id);
  if (!isTagExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Tag was not found!");
  }

  if (isTagExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Tag is already deleted!");
  }

  const result = await TagModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });

  return result;
};

export const TagServices = {
  createTagIntoDB,
  getAllTagsFromDB,
  updateTagIntoDB,
  deleteTagIntoDB,
};
