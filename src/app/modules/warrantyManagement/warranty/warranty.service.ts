import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { Order } from "../../orderManagement/order/order.model";
import { TWarrantyInfoInput } from "./warranty.interface";

const createWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[]
) => {
  const session = await mongoose.startSession();
  // const { startDate, endDate } = warrantyDuration("1 years");

  try {
    session.startTransaction();

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(order_id) } },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "products",
          localField: "productDetails.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $lookup: {
          from: "images",
          localField: "productInfo.image.thumbnail",
          foreignField: "_id",
          as: "productThumb",
        },
      },
      {
        $unwind: "$productThumb",
      },
      {
        $lookup: {
          from: "warranties",
          localField: "productDetails.warranty",
          foreignField: "_id",
          as: "warranty",
        },
      },
      {
        $addFields: {
          warranty: {
            $cond: {
              if: { $eq: [{ $size: "$warranty" }, 0] },
              then: {
                warrantyCodes: null,
                createdAt: null,
              },
              else: { $arrayElemAt: ["$warranty", 0] },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          product: {
            _id: "$productDetails._id",
            product: {
              _id: "$productInfo._id",
              title: "$productInfo.title",
              warranty: "$productInfo.warranty",
              warrantyInfo: "$productInfo.warrantyInfo",
            },
            warranty: {
              warrantyCodes: "$warranty.warrantyCodes",
              createdAt: "$warranty.createdAt",
            },
            unitPrice: "$productDetails.unitPrice",
            quantity: "$productDetails.quantity",
            total: "$productDetails.total",
          },
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          products: { $push: "$product" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ];

    const order = (await Order.aggregate(pipeline))[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found with");
    }

    for (const item of order.products) {
      if (item?.product?.warranty) {
        const findTheWarrantyIdFromInput = warrantyInfo.find(
          (infoItem) => infoItem.itemId === item._id.toString()
        );
        if (findTheWarrantyIdFromInput?.codes?.length !== item?.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Please insert all warranty codes"
          );
        }
        if (item?.warranty?.warrantyCodes?.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Warranty for product: ${item?.product?.title} is already exist`
          );
        }
        // console.log(findTheWarrantyIdFromInput);
        // console.log(item.warranty);
      }
    }

    // console.log(order.products);
    // console.log(order.products[0]?.product?.warrantyInfo);

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const WarrantyService = {
  createWarrantyIntoDB,
};
