import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import generateProductId from "../../../utilities/generateProductId";
import { InventoryModel } from "../inventory/inventory.model";
import PriceModel from "../price/price.model";
import { SeoDataModel } from "../seoData/seoData.model";
import { publishedStatusQuery, visibilityStatusQuery } from "./product.const";
import { TProduct } from "./product.interface";
import ProductModel from "./product.model";
import { AggregateQueryHelperFacet } from "../../../helper/query.helper";
import { Order } from "../../orderManagement/order/order.model";

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

    // if (payload.seoData) {
    //   payload.seoData = (
    //     await SeoDataModel.create([payload.seoData], { session })
    //   )[0]._id;
    // }

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
  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        isDeleted: false,
        "publishedStatus.status": publishedStatusQuery.Published,
        "publishedStatus.visibility": visibilityStatusQuery.Public,
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "image.thumbnail",
        foreignField: "_id",
        as: "thumbnail",
        pipeline: [{ $project: { src: 1, alt: 1 } }],
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "image.gallery",
        foreignField: "_id",
        as: "gallery",
        pipeline: [{ $project: { src: 1, alt: 1 } }],
      },
    },
    {
      $lookup: {
        from: "prices",
        localField: "price",
        foreignField: "_id",
        as: "price",
        pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "inventory",
        foreignField: "_id",
        as: "inventory",
        pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category.name",
        foreignField: "_id",
        as: "myCategory",
        // pipeline: [{ $project: { name: 1 } }],
      },
    },
    {
      $lookup: {
        from: "subcategories",
        localField: "category.subCategory",
        foreignField: "_id",
        as: "subCategory",
        pipeline: [{ $project: { _id: 1, name: 1, slug: 1 } }],
      },
    },
    {
      $lookup: {
        from: "attributes",
        localField: "attributes.name",
        foreignField: "_id",
        as: "myAttributes",
        pipeline: [{ $project: { createdAt: 0, updatedAt: 0 } }],
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand",
        pipeline: [{ $project: { name: 1, slug: 1 } }],
      },
    },
    {
      $unwind: "$thumbnail",
    },
    {
      $unwind: "$price",
    },
    {
      $unwind: "$inventory",
    },
    {
      $unwind: "$myCategory",
    },
    {
      $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true },
    },
    {
      $unwind: { path: "$brand", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 1,
        id: 1,
        title: 1,
        slug: 1,
        description: 1,
        shortDescription: 1,
        thumbnail: "$thumbnail",
        gallery: "$gallery",
        price: "$price",
        inventory: "$inventory",
        category: {
          _id: "$myCategory._id",
          name: "$myCategory.name",
          slug: "$myCategory.slug",
          subCategory: "$subCategory",
        },
        attributes: {
          $map: {
            input: "$myAttributes",
            as: "a",
            in: {
              _id: "$$a._id",
              name: "$$a.name",
              values: {
                $filter: {
                  input: "$$a.values",
                  as: "value",
                  cond: {
                    $in: [
                      "$$value._id",
                      {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: {
                                $filter: {
                                  input: "$attributes",
                                  as: "s",
                                  cond: { $eq: ["$$s.name", "$$a._id"] },
                                },
                              },
                              as: "sa",
                              in: "$$sa.values",
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        variations: 1,
        brand: "$brand",
        warranty: 1,
        warrantyInfo: 1,
        publishedStatus: 1,
      },
    },
  ];

  const result = await ProductModel.aggregate(pipeline);

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The product was not found!");
  }
  return result[0];
};

const getAProductAdminFromDB = async (id: string) => {
  const result = await ProductModel.findOne({
    _id: id,
  }).populate([
    { path: "image.thumbnail", select: "src alt" },
    { path: "image.gallery", select: "src alt" },
    { path: "price", select: "-createdAt -updatedAt" },
    { path: "inventory", select: "-createdAt -updatedAt" },
    { path: "category.name", select: "name" },
    { path: "category.subCategory", select: "name" },
    { path: "attributes.name", select: "name" },
    // { path: "seoData", select: "-createdAt -updatedAt" },
    { path: "brand", select: "name" },
    // { path: "tag", select: "name" },
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
  let filterQuery: Record<string, unknown> = {};

  const { minPrice, maxPrice, category, subCategory, brand } = query;

  if (minPrice && maxPrice) {
    filterQuery = {
      $expr: {
        $and: [
          { $gte: ["$price.salePrice", Number(minPrice)] },
          { $lte: ["$price.salePrice", Number(maxPrice)] },
        ],
      },
    };
  }

  if (category) {
    filterQuery["category.slug"] = query.category;
  }
  if (subCategory) {
    filterQuery["subcategory.slug"] = query.subCategory;
  }
  if (brand) {
    filterQuery["brand.slug"] = query.brand;
  }

  const pipeline = [
    {
      $match: {
        isDeleted: false,
        "publishedStatus.status": publishedStatusQuery.Published,
        "publishedStatus.visibility": visibilityStatusQuery.Public,
      },
    },
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
        localField: "category.name",
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
    // {
    //   $lookup: {
    //     from: "reviews",
    //     localField: "_id",
    //     foreignField: "product",
    //     as: "review",
    //   },
    // },
    { $match: filterQuery },
    {
      $facet: {
        // Define sub-pipeline 2: For other operations
        data: [
          {
            $project: {
              _id: 1,
              title: 1,
              slug: 1,
              // shortDescription: 1,
              regularPrice: "$price.regularPrice",
              salePrice: "$price.salePrice",
              discountPercent: "$price.discountPercent",
              priceSave: "$price.priceSave",
              stockStatus: "$inventory.stockStatus",
              // stockAvailable: "$inventory.stockAvailable",
              // totalReview: { $size: "$review" },
              // averageRating: { $avg: "$review.rating" },
              thumbnail: {
                _id: "$thumbnail._id",
                src: "$thumbnail.src",
                alt: "$thumbnail.alt",
              },
              category: {
                _id: "$category._id",
                name: "$category.name",
                slug: "$category.slug",
              },
              // brand: {
              //   $map: {
              //     input: "$brand",
              //     as: "b",
              //     in: {
              //       _id: "$$b._id",
              //       name: "$$b.name",
              //     },
              //   },
              // },
            },
          },
        ],
        // Define sub-pipeline 1: For getting total count
        total: [
          {
            $count: "total",
          },
        ],
      },
    },
    { $unwind: "$total" },
    {
      $project: {
        data: 1,
        total: "$total.total",
      },
    },
  ];

  const productQuery = new AggregateQueryHelperFacet(
    ProductModel,
    pipeline,
    query
  )
    .search([
      "title",
      "description",
      "category.name",
      "subcategory.name",
      "brand.name",
    ])
    .sort()
    .paginate();

  const data = await productQuery.metaData();

  return { ...data };
};

const getAllProductsAdminFromDB = async (query: Record<string, unknown>) => {
  const filterQuery: Record<string, unknown> = {};

  if (
    (query.status && query.status === publishedStatusQuery.Published) ||
    query.status === publishedStatusQuery.Draft
  ) {
    const statusRegex = new RegExp(`\\b${query.status}\\b`, "i");
    filterQuery["publishedStatus.status"] = statusRegex;
  }

  if (
    (query.status && query.status == visibilityStatusQuery.Public) ||
    query.status == visibilityStatusQuery.Private
  ) {
    const statusRegex = new RegExp(`\\b${query.status}\\b`, "i");
    filterQuery["publishedStatus.visibility"] = statusRegex;
  }

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
        localField: "category.name",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    // {
    //   $lookup: {
    //     from: "reviews",
    //     localField: "_id",
    //     foreignField: "product",
    //     as: "review",
    //   },
    // },
    { $match: filterQuery },
    {
      $facet: {
        // Define sub-pipeline 2: For other operations
        data: [
          {
            $project: {
              title: 1,
              regularPrice: "$price.regularPrice",
              salePrice: "$price.salePrice",
              sku: "$inventory.sku",
              stockStatus: "$inventory.stockStatus",
              stockAvailable: "$inventory.stockAvailable",
              // totalReview: { $size: "$review" },
              // averageRating: { $avg: "$review.rating" },
              thumbnail: {
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
        ],
        // Define sub-pipeline 1: For getting total count
        total: [
          {
            $count: "total",
          },
        ],
      },
    },
    { $unwind: "$total" },
    {
      $project: {
        data: 1,
        total: "$total.total",
      },
    },
  ];

  // get counts
  const statusMap = {
    all: 0,
    Public: 0,
    Private: 0,
    Published: 0,
    Draft: 0,
  };

  const statusPipeline = [
    {
      $match: {
        isDeleted: false,
        $or: [
          {
            "publishedStatus.status": {
              $in: [publishedStatusQuery.Published, publishedStatusQuery.Draft],
            },
          },
          {
            "publishedStatus.visibility": {
              $in: [
                visibilityStatusQuery.Public,
                visibilityStatusQuery.Private,
              ],
            },
          },
        ],
      },
    },
    {
      $facet: {
        status: [
          {
            $group: {
              _id: "$publishedStatus.status",
              total: { $sum: 1 },
            },
          },
        ],
        visibility: [
          {
            $group: {
              _id: "$publishedStatus.visibility",
              total: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $project: {
        countsByStatus: {
          $concatArrays: ["$status", "$visibility"],
        },
      },
    },
  ];

  const result = await ProductModel.aggregate(statusPipeline);

  result[0]?.countsByStatus?.forEach(
    ({ _id, total }: { _id: string; total: number }) => {
      if (_id in statusMap) {
        statusMap[_id as keyof typeof statusMap] = total;
      }
      // Check if _id is "Public" or "Private" and add their totals to statusMap.all
      if (
        _id === visibilityStatusQuery.Public ||
        _id === visibilityStatusQuery.Private
      ) {
        statusMap.all += total;
      }
    }
  );

  const formattedResult = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  const productQuery = new AggregateQueryHelperFacet(
    ProductModel,
    pipeline,
    query
  )
    .search([
      "title",
      "price",
      "sku",
      "description",
      "category.name",
      "subcategory.name",
      "brand.name",
    ])
    .sort()
    .paginate();

  const data = await productQuery.metaData();

  return { ...data, countsByStatus: formattedResult };
};

const getFeaturedProductsFromDB = async (query: Record<string, unknown>) => {
  const pipeline = [
    {
      $match: {
        isDeleted: false,
        featured: true,
        "publishedStatus.status": publishedStatusQuery.Published,
        "publishedStatus.visibility": visibilityStatusQuery.Public,
      },
    },
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
        localField: "category.name",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
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
    // {
    //   $lookup: {
    //     from: "reviews",
    //     localField: "_id",
    //     foreignField: "product",
    //     as: "review",
    //   },
    // },
    // Project specific fields
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        // shortDescription: 1,
        regularPrice: "$price.regularPrice",
        salePrice: "$price.salePrice",
        discountPercent: "$price.discountPercent",
        priceSave: "$price.priceSave",
        stockStatus: "$inventory.stockStatus",
        // stockAvailable: "$inventory.stockAvailable",
        // totalReview: { $size: "$review" },
        // averageRating: { $avg: "$review.rating" },
        thumbnail: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
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

const getBestSellingProductsFromDB = async (query: Record<string, unknown>) => {
  const pipeline: PipelineStage[] = [
    {
      $match: { status: { $ne: "deleted" } },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: "$productDetails.product",
        totalQuantity: { $sum: "$productDetails.quantity" },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "prices",
        localField: "product.price",
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
        localField: "product.image.thumbnail",
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
        localField: "product.category.name",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "inventories",
        localField: "product.inventory",
        foreignField: "_id",
        as: "inventory",
      },
    },
    {
      $unwind: "$inventory",
    },
    // {
    //   $lookup: {
    //     from: "reviews",
    //     localField: "_id",
    //     foreignField: "product",
    //     as: "review",
    //   },
    // },
    // Project specific fields
    {
      $project: {
        _id: "$_id",
        title: "$product.title",
        slug: "$product.slug",
        // shortDescription: "$product.shortDescription",
        regularPrice: "$price.regularPrice",
        salePrice: "$price.salePrice",
        discountPercent: "$price.discountPercent",
        priceSave: "$price.priceSave",
        stockStatus: "$inventory.stockStatus",
        // stockAvailable: "$inventory.stockAvailable",
        // totalReview: { $size: "$review" },
        // averageRating: { $avg: "$review.rating" },
        thumbnail: {
          _id: "$thumbnail._id",
          src: "$thumbnail.src",
          alt: "$thumbnail.alt",
        },
        category: {
          _id: "$category._id",
          name: "$category.name",
          slug: "$category.slug",
        },
      },
    },
  ];

  const productQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).paginate();

  const data = await productQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
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
      attributes,
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
    if (
      isProductExist.publishedStatus.status == "Published" &&
      publishedStatus?.status == "Draft"
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Published product can not be Draft! Make it private to hide it from customers."
      );
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
    if (attributes?.length) {
      updateAttribute = attributes;
    }
    if (brand) {
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

const deleteProductFromDB = async (
  productIds: string[],
  deletedBy: Types.ObjectId
) => {
  const result = await ProductModel.updateMany(
    { _id: { $in: productIds } },
    {
      $set: {
        deletedBy,
        isDeleted: true,
      },
    }
  );

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAProductCustomerFromDB,
  getAProductAdminFromDB,
  getAllProductsCustomerFromDB,
  getAllProductsAdminFromDB,
  getFeaturedProductsFromDB,
  getBestSellingProductsFromDB,
  updateProductIntoDB,
  deleteProductFromDB,
};
