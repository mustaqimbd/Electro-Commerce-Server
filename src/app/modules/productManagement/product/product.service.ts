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

const createProductIntoDB = async (
  createdBy: Types.ObjectId,
  payload: TProduct
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    payload.createdBy = createdBy;
    const generatedProductId = await generateProductId();
    payload.id = generatedProductId;
    payload.price = (
      await PriceModel.create([payload.price], { session })
    )[0]._id;
    payload.image = (
      await ProductImageModel.create([payload.image], { session })
    )[0]._id;
    payload.inventory = (
      await InventoryModel.create([payload.inventory], { session })
    )[0]._id;
    if (payload.seoData) {
      payload.seoData = (
        await SeoDataModel.create([payload.seoData], { session })
      )[0]._id;
    }

    const product = (await ProductModel.create([payload], { session }))[0];

    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getProductFromDB = async (id: string) => {
  const result = await ProductModel.findOne({
    _id: id,
    isDeleted: false,
  }).populate([
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

const getAllProductsFromDB = async () => {
  const result = await ProductModel.find({ isDeleted: false }).populate([
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
  updatedBy: Types.ObjectId,
  id: string,
  payload: TProduct
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      price,
      image,
      inventory,
      seoData,
      publishedStatus,
      attribute,
      brand,
      category,
      tag,
      ...remainingUpdateData
    } = payload;
    const isProductExist = await ProductModel.findById(id);

    if (!isProductExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The Product was not found!");
    }

    if (isProductExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The Product is deleted!");
    }

    if (price && Object.keys(price).length) {
      const updatePrice: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(price)) {
        if (key === "date") {
          for (const [dateKey, dateValue] of Object.entries(value)) {
            updatePrice[`date.${dateKey}`] = dateValue;
          }
        } else {
          updatePrice[key] = value;
        }
      }
      await PriceModel.findByIdAndUpdate(
        isProductExist.price,
        { $set: { ...updatePrice, updatedBy } },
        { session }
      );
    }

    if (image && Object.keys(image).length) {
      await ProductImageModel.findByIdAndUpdate(
        isProductExist.image,
        { $set: { ...image, updatedBy } },
        { session }
      );
    }
    if (inventory && Object.keys(inventory).length) {
      await InventoryModel.findByIdAndUpdate(
        isProductExist.inventory,
        { $set: { ...inventory, updatedBy } },
        { session }
      );
    }
    if (seoData && Object.keys(seoData).length) {
      await SeoDataModel.findByIdAndUpdate(
        isProductExist.seoData,
        { $set: { ...seoData, updatedBy } },
        { session }
      );
    }

    const updatePublishedStatus: Record<string, unknown> = {};
    if (publishedStatus && Object.keys(publishedStatus).length) {
      for (const [key, value] of Object.entries(publishedStatus)) {
        updatePublishedStatus[`publishedStatus.${key}`] = value;
      }
    }

    let updateAttribute, updateBrand, updateCategory, updateTag;
    if (attribute?.length) {
      updateAttribute = attribute;
    }
    if (brand?.length) {
      updateBrand = brand;
    }
    if (category?.length) {
      updateCategory = category;
    }
    if (tag?.length) {
      updateTag = tag;
    }

    const product = await ProductModel.findByIdAndUpdate(
      isProductExist._id,
      {
        $set: {
          attribute: updateAttribute,
          brand: updateBrand,
          category: updateCategory,
          tag: updateTag,
          ...remainingUpdateData,
          ...updatePublishedStatus,
          updatedBy,
        },
      },
      { session, new: true }
    );

    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteProductFromDB = async (deletedBy: Types.ObjectId, id: string) => {
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
    deletedBy,
    isDeleted: true,
  });

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getProductFromDB,
  getAllProductsFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
