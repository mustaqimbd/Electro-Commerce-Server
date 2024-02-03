import { TImage } from "./image.interface";
import { ImageModel } from "./image.model";

const createImageIntoDb = async (payload: Partial<TImage[]>) => {
  const result = await ImageModel.create(payload);
  return result;
};
const getAllImagesFromDb = async () => {
  const result = await ImageModel.find({ isDeleted: false });
  return result;
};
const deleteImagesFromDB = async (imageIds: string[]) => {
  const result = await ImageModel.deleteMany({ _id: { $in: imageIds } });
  return result;
};
export const ImageServices = {
  createImageIntoDb,
  getAllImagesFromDb,
  deleteImagesFromDB,
};
