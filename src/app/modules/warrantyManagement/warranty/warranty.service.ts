import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { warrantyDuration } from "../../../utilities/warrantyDuration";
import { Order } from "../../orderManagement/order/order.model";
import { TWarrantyData, TWarrantyInfoInput } from "./warranty.interface";
import { Warranty } from "./warranty.model";
import { findOrderWithWarrantyPipeline } from "./warranty.utils";

const createWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[]
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pipeline = findOrderWithWarrantyPipeline(order_id);

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

const updateWarrantyIntoDB = async (
  order_id: mongoose.Types.ObjectId,
  warrantyInfo: TWarrantyInfoInput[]
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const pipeline = findOrderWithWarrantyPipeline(order_id);

    const order = (await Order.aggregate(pipeline))[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found");
    }

    for (const { itemId, codes } of warrantyInfo || []) {
      const findUpdatingItem = order?.products?.find(
        ({ _id }: { _id: mongoose.Types.ObjectId }) =>
          _id.toString() === itemId.toString()
      );
      if (findUpdatingItem) {
        if (findUpdatingItem.quantity !== codes.length) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please add ${findUpdatingItem.quantity} warranty codes for '${findUpdatingItem?.product?.title}'`
          );
        }
      }

      await Warranty.updateOne(
        { _id: findUpdatingItem?.warranty?._id },
        { $set: { warrantyCodes: codes } },
        { session, upsert: true }
      );
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
  updateWarrantyIntoDB,
};
