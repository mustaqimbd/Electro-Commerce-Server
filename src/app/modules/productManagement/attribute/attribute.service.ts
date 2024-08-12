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
    name: { $regex: new RegExp(payload.name, "i") },
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
  const result = await AttributeModel.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $project: {
        name: 1,
        values: {
          $filter: {
            input: "$values",
            as: "value",
            cond: { $eq: ["$$value.isDeleted", false] },
          },
        },
      },
    },
  ]);

  return result;
};

const updateAttributeIntoDB = async (
  updatedBy: Types.ObjectId,
  id: string,
  payload: TAttribute
) => {
  payload.updatedBy = updatedBy;

  const isAttributeExist = await AttributeModel.findById(id);

  if (!isAttributeExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The attribute was not found!");
  }
  if (isAttributeExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The attribute is deleted!");
  }

  const { name, values = [] } = payload;
  let result;
  if (name) {
    result = await AttributeModel.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
  }

  for (const value of values) {
    if (value._id) {
      // Update the existing elements in the values array
      result = await AttributeModel.updateOne(
        { _id: id, "values._id": value._id }, // Find the document by id and specific subdocument by _id
        { $set: { "values.$.name": value.name, updatedBy } } // Update the name of the specific subdocument
      );
    } else {
      // Add new elements to the values array if _id does not exist
      result = await AttributeModel.updateOne(
        { _id: id },
        { $push: { values: { name: value.name, updatedBy } } } // Add the new element to the array
      );
    }
  }

  return result;
};

const deleteAttributeFromDB = async (
  deletedBy: Types.ObjectId,
  attributeIds: string[],
  valueIds: string[]
) => {
  if (attributeIds && attributeIds.length > 0) {
    await AttributeModel.updateMany(
      { _id: { $in: attributeIds } },
      { $set: { isDeleted: true, deletedBy } }
    );
  }
  if (valueIds && valueIds.length > 0) {
    await AttributeModel.updateMany(
      { "values._id": { $in: valueIds } },
      { $set: { "values.$[elem].isDeleted": true, deletedBy } },
      { arrayFilters: [{ "elem._id": { $in: valueIds } }] }
    );
  }
};

export const AttributeServices = {
  createAttributeIntoDB,
  getAllAttributesFromDB,
  updateAttributeIntoDB,
  deleteAttributeFromDB,
};
