import mongoose, { Types } from "mongoose";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
import { ProductImageModel } from "../productImage/productImage.model";
import { SeoDataModel } from "../seoData/seoData.model";
import { TProduct } from "./product.interface";
import ApiError from "../../../errorHandlers/ApiError";
import httpStatus from "http-status";
import ProductModel from "./product.mode";
import generateProductId from "../../../utilities/generateProductId";
import { NextFunction } from "express";

const createProductIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TProduct,
  next: NextFunction
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    payload.createdBy = createdBy;
    const generatedProductId = await generateProductId();
    payload.id = generatedProductId;
    const price = await PriceModel.create([payload.price], { session });
    const image = await ProductImageModel.create([payload.image], { session });
    const inventory = await InventoryModel.create([payload.inventory], {
      session,
    });
    let seoData;
    if (payload.seoData) {
      seoData = await SeoDataModel.create([payload.seoData], { session });
      payload.seoData = seoData[0]._id;
    }
    payload.price = price[0]._id;
    payload.image = image[0]._id;
    payload.inventory = inventory[0]._id;
    const product = await ProductModel.create([payload], { session });
    await session.commitTransaction();
    return product[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const getAllProductsFromDB = async () => {
  const result = await ProductModel.find().populate([
    { path: "price", select: "-createdAt -updatedAt" },
    { path: "image", select: "-createdAt -updatedAt" },
    { path: "inventory", select: "-createdAt -updatedAt" },
    { path: "seoData", select: "-createdAt -updatedAt" },
    { path: "brand", select: "name" },
    { path: "category", select: "name" },
    { path: "tag", select: "name" },
  ]);

  return result;
};

const updateProductIntoDB = async (
  createdBy: Types.ObjectId,
  id: string,
  payload: TProduct
) => {
  payload.createdBy = createdBy;
  const isProductExist = await ProductModel.findById(id);

  if (!isProductExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Product was not found!");
  }

  if (isProductExist.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The Product is deleted!");
  }
  const isUpdateProductDeleted = await ProductModel.findOne({
    isDeleted: true,
  });

  if (isUpdateProductDeleted) {
    const result = await ProductModel.findByIdAndUpdate(
      isUpdateProductDeleted._id,
      { createdBy, isDeleted: false },
      { new: true }
    );
    await ProductModel.findByIdAndUpdate(id, { isDeleted: true });
    return result;
  } else {
    const result = await ProductModel.findByIdAndUpdate(id, payload, {
      new: true,
    });
    return result;
  }
};

const deleteProductFromDB = async (createdBy: Types.ObjectId, id: string) => {
  const isProductExist = await ProductModel.findById(id);
  if (!isProductExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "The Product was not found!");
  }

  if (isProductExist.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The Product is already deleted!"
    );
  }

  const result = await ProductModel.findByIdAndUpdate(id, {
    createdBy,
    isDeleted: true,
  });

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
