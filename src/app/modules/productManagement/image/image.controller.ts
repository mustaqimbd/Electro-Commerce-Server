/* eslint-disable no-undef */
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ImageServices } from "./image.service";

const createImage = catchAsync(async (req, res) => {
  const uploadedBy = req.user.id;
  const files = req.files as Express.Multer.File[];
  const images = files?.map(({ path, originalname }: Express.Multer.File) => {
    return { src: path, alt: originalname, uploadedBy };
  });
  const result = await ImageServices.createImageIntoDb(images);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Image created successfully!",
    data: result,
  });
});

const getAllImages = catchAsync(async (req, res) => {
  const result = await ImageServices.getAllImagesFromDb();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All images retrieved successfully!",
    data: result,
  });
});

const deleteImages = catchAsync(async (req, res) => {
  const { imageIds } = req.body;
  const result = await ImageServices.deleteImagesFromDB(imageIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Images deleted successfully!",
    data: result,
  });
});

export const ImageControllers = {
  createImage,
  getAllImages,
  deleteImages,
};
