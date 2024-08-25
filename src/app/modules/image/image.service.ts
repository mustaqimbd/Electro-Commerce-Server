import { Types } from "mongoose";
import { QueryHelper } from "../../helper/query.helper";
import { TImage } from "./image.interface";
import { ImageModel } from "./image.model";

const createImageIntoDB = async (payload: Partial<TImage[]>) => {
  const result = await ImageModel.create(payload);
  return result;
};

const getAnImageFromDB = async (id: string) => {
  if (id != "undefined") {
    const result = await ImageModel.findById(id, "_id src alt");
    return result;
  } else {
    return {};
  }
};

const getAllImagesFromDB = async (query: Record<string, unknown>) => {
  const imageQuery = new QueryHelper(
    ImageModel.find({ isDeleted: false }),
    query
  )
    .sort()
    .paginate();
  const data = await imageQuery.model;
  const meta = await imageQuery.metaData();
  return { meta, data };
};

const deleteImagesFromDB = async (
  deletedBy: Types.ObjectId,
  imageIds: string[]
) => {
  const result = await ImageModel.updateMany(
    { _id: { $in: imageIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );
  return result;
};

export const ImageServices = {
  createImageIntoDB,
  getAnImageFromDB,
  getAllImagesFromDB,
  deleteImagesFromDB,
};
