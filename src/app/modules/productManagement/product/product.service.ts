import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import generateProductId from "../../../utilities/generateProductId";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
import { SeoDataModel } from "../seoData/seoData.model";
import { publishedStatusQuery, visibilityStatusQuery } from "./product.const";
import { TProduct } from "./product.interface";
import ProductModel from "./product.model";

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

const getAProductCustomerFromDB = async (id: string) => {
  const result = await ProductModel.findOne({
    _id: id,
    isDeleted: false,
    "publishedStatus.status": publishedStatusQuery.Published,
    "publishedStatus.visibility": visibilityStatusQuery.Public,
  }).populate([
    { path: "price", select: "-createdAt -updatedAt" },
    { path: "image.thumbnail", select: "src alt" },
    { path: "image.gallery", select: "src alt" },
    { path: "inventory", select: "-createdAt -updatedAt" },
    { path: "seoData", select: "-createdAt -updatedAt" },
    { path: "brand", select: "name" },
    { path: "category._id", select: "name" },
    { path: "category.subCategory", select: "name" },
    { path: "tag", select: "name" },
  ]);
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product was not found!");
  }
  return result;
};

const getAProductAdminFromDB = async (id: string) => {
  const result = await ProductModel.findOne({
    _id: id,
  }).populate([
    { path: "price", select: "-createdAt -updatedAt" },
    { path: "image.thumbnail", select: "src alt" },
    { path: "image.gallery", select: "src alt" },
    { path: "inventory", select: "-createdAt -updatedAt" },
    { path: "seoData", select: "-createdAt -updatedAt" },
    { path: "brand", select: "name" },
    { path: "category._id", select: "name" },
    { path: "category.subCategory", select: "name" },
    { path: "tag", select: "name" },
  ]);
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product was not found!");
  }
  if (result.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product is deleted!");
  }

  return result;
};

const getAllProductsCustomerFromDB = async (query: Record<string, unknown>) => {
  const filterQuery: Record<string, unknown> = {};
  if (query.category) {
    filterQuery["category._id"] = new mongoose.Types.ObjectId(
      query.category as string
    );
  }
  if (query.subCategory) {
    filterQuery["subcategory._id"] = new mongoose.Types.ObjectId(
      query.subCategory as string
    );
  }
  if (query.brand) {
    filterQuery["brand._id"] = new mongoose.Types.ObjectId(
      query.brand as string
    );
  }
  const pipeline = [
    {
      $match: {
        isDeleted: false,
        "publishedStatus.status": publishedStatusQuery.Published,
        "publishedStatus.visibility": visibilityStatusQuery.Public,
      },
    },
    // Populate the "price" field
    {
      $lookup: {
        from: "prices",
        localField: "price",
        foreignField: "_id",
        as: "price",
      },
    },
    {
      $unwind: "$price",
    },
    {
      $lookup: {
        from: "images",
        localField: "image.thumbnail",
        foreignField: "_id",
        as: "thumbnail",
      },
    },
    {
      $unwind: "$thumbnail",
    },
    {
      $lookup: {
        from: "inventories",
        localField: "inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: "$inventory",
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "category.subCategory",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category._id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
      },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "review",
      },
    },
    { $match: filterQuery },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        shortDescription: 1,
        price: "$price.regularPrice",
        salePrice: "$price.salePrice",
        discountPercent: "$price.discountPercent",
        stock: "$inventory.stockStatus",
        stockAvailable: "$inventory.stockAvailable",
        totalReview: { $size: "$review" },
        averageRating: { $avg: "$review.rating" },
        image: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        category: {
          _id: "$category._id",
          name: "$category.name",
        },
        brand: {
          $map: {
            input: "$brand",
            as: "b",
            in: {
              _id: "$$b._id",
              name: "$$b.name",
            },
          },
        },
      },
    },
  ];

  const productQuery = new AggregateQueryHelper(
    ProductModel.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await productQuery.model;
  const total = (await ProductModel.aggregate(pipeline)).length;
  const meta = productQuery.metaData(total);

  return { meta, data };
};
const getAllProductsAdminFromDB = async (query: Record<string, unknown>) => {
  const filterQuery: Record<string, unknown> = {};

  if (query.category) {
    filterQuery["category._id"] = new mongoose.Types.ObjectId(
      query.category as string
    );
  }
  if (query.subCategory) {
    filterQuery["subcategory._id"] = new mongoose.Types.ObjectId(
      query.subCategory as string
    );
  }
  if (query.stock) {
    const stockRegex = new RegExp(`\\b${query.stock}\\b`, "i");
    filterQuery["inventory.stockStatus"] = stockRegex;
  }

  const pipeline = [
    { $match: { isDeleted: false } },
    {
      $lookup: {
        from: "prices",
        localField: "price",
        foreignField: "_id",
        as: "price",
      },
    },
    {
      $unwind: "$price",
    },
    {
      $lookup: {
        from: "images",
        localField: "image.thumbnail",
        foreignField: "_id",
        as: "thumbnail",
      },
    },
    {
      $unwind: "$thumbnail",
    },
    {
      $lookup: {
        from: "inventories",
        localField: "inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: "$inventory",
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "category.subCategory",
        foreignField: "_id",
        as: "subcategory",
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category._id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "review",
      },
    },
    { $match: filterQuery },
    {
      $project: {
        title: 1,
        price: "$price.regularPrice",
        sku: "$inventory.sku",
        stock: "$inventory.stockStatus",
        stockAvailable: "$inventory.stockAvailable",
        totalReview: { $size: "$review" },
        averageRating: { $avg: "$review.rating" },
        image: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        category: {
          _id: "$category._id",
          name: "$category.name",
        },
        // subCategory: {
        //   $map: {
        //     input: "$subcategory",
        //     as: "sub",
        //     in: {
        //       _id: "$$sub._id",
        //       name: "$$sub.name",
        //     },
        //   },
        // },
        published: "$publishedStatus.date",
      },
    },
  ];
  const productQuery = new AggregateQueryHelper(
    ProductModel.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await productQuery.model;
  const total = (await ProductModel.aggregate(pipeline)).length;
  const meta = productQuery.metaData(total);

  return { meta, data };
};

const getFeaturedProductsFromDB = async (query: Record<string, unknown>) => {
  const pipeline = [
    {
      $match: {
        isDeleted: false,
        featured: true,
        "publishedStatus.status": "Published",
        "publishedStatus.visibility": "Public",
      },
    },
    // Populate the "price" field
    {
      $lookup: {
        from: "prices",
        localField: "price",
        foreignField: "_id",
        as: "price",
      },
    },
    {
      $unwind: "$price",
    },
    {
      $lookup: {
        from: "images",
        localField: "image.thumbnail",
        foreignField: "_id",
        as: "thumbnail",
      },
    },
    {
      $unwind: "$thumbnail",
    },
    {
      $lookup: {
        from: "categories",
        localField: "category._id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "review",
      },
    },
    // Project specific fields
    {
      $project: {
        title: 1,
        slug: 1,
        regularPrice: "$price.regularPrice",
        salePrice: "$price.salePrice",
        discountPercent: "$price.discountPercent",
        totalReview: { $size: "$review" },
        averageRating: { $avg: "$review.rating" },
        image: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        category: {
          _id: "$category._id",
          name: "$category.name",
        },
      },
    },
  ];

  const productQuery = new AggregateQueryHelper(
    ProductModel.aggregate(pipeline),
    query
  ).paginate();

  const data = await productQuery.model;
  const total = (await ProductModel.aggregate(pipeline)).length;
  const meta = productQuery.metaData(total);
  return { meta, data };
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
      warrantyInfo,
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
    const updateImage: Record<string, unknown> = {};
    if (image && Object.keys(image).length) {
      for (const [key, value] of Object.entries(image)) {
        updateImage[`image.${key}`] = value;
      }
    }
    const updateCategory: Record<string, unknown> = {};
    if (category && Object.keys(category).length) {
      for (const [key, value] of Object.entries(category)) {
        updateCategory[`category.${key}`] = value;
      }
    }
    const updateWarrantyInfo: Record<string, unknown> = {};
    if (warrantyInfo && Object.keys(warrantyInfo).length) {
      for (const [key, value] of Object.entries(warrantyInfo)) {
        updateWarrantyInfo[`warrantyInfo.${key}`] = value;
      }
    }
    const updatePublishedStatus: Record<string, unknown> = {};
    if (publishedStatus && Object.keys(publishedStatus).length) {
      for (const [key, value] of Object.entries(publishedStatus)) {
        updatePublishedStatus[`publishedStatus.${key}`] = value;
      }
    }

    let updateAttribute, updateBrand, updateTag;
    if (attribute?.length) {
      updateAttribute = attribute;
    }
    if (brand?.length) {
      updateBrand = brand;
    }
    if (tag?.length) {
      updateTag = tag;
    }

    const product = await ProductModel.findByIdAndUpdate(
      isProductExist._id,
      {
        $set: {
          ...updateImage,
          attribute: updateAttribute,
          brand: updateBrand,
          ...updateCategory,
          tag: updateTag,
          ...updateWarrantyInfo,
          ...updatePublishedStatus,
          ...remainingUpdateData,
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
  getAProductCustomerFromDB,
  getAProductAdminFromDB,
  getAllProductsCustomerFromDB,
  getAllProductsAdminFromDB,
  getFeaturedProductsFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
