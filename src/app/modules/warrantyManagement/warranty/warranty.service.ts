import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { warrantyDuration } from "../../../utilities/warrantyDuration";
import { Order } from "../../orderManagement/order/order.model";
import { TWarrantyData, TWarrantyInfoInput } from "./warranty.interface";
import { Warranty } from "./warranty.model";

const createWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[]
) => {
  const session = await mongoose.startSession();

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
          orderId: 1,
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
          orderId: { $first: "$orderId" },
          products: { $push: "$product" },
          createdAt: { $first: "$createdAt" },
        },
      },
    ];

    const order = (await Order.aggregate(pipeline))[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found with");
    }
    for (const item of order?.products || []) {
      if (item?.product?.warranty) {
        const findWarrantyInput = warrantyInfo.find(
          (itemInfo) => itemInfo.itemId === item._id.toString()
        );

        if (!findWarrantyInput) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add warranty for '${item?.product?.title}'`
          );
        }

        if (findWarrantyInput?.codes?.length !== item?.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add ${item.quantity} warranty codes for '${item.product.title}'`
          );
        }

        if (item?.warranty?.warrantyCodes?.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Warranty for product: '${item?.product?.title}' is already exist`
          );
        }

        const { startDate, endDate } = warrantyDuration(
          item?.product?.warrantyInfo?.duration
        );

        if (!startDate || !endDate) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Failed to calculate start and ends date"
          );
        }

        const warrantyData: TWarrantyData = {
          order_id,
          orderId: order?.orderId,
          productId: item?.product?._id,
          duration: item?.product?.warrantyInfo?.duration,
          startDate,
          endsDate: endDate as string,
          warrantyCodes: findWarrantyInput?.codes as string[],
        };

        const warrantyRes = (
          await Warranty.create([warrantyData], { session })
        )[0];
        await Order.findOneAndUpdate(
          {
            _id: order_id,
            "productDetails._id": item._id,
          },
          {
            $set: { "productDetails.$.warranty": warrantyRes._id },
          },
          { session }
        );
      }
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const WarrantyService = {
  createWarrantyIntoDB,
};
