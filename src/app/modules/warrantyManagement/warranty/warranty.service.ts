import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TProductDetails } from "../../orderManagement/order/order.interface";
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
    const order = (
      await Order.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            status: { $ne: "canceled" },
            _id: new mongoose.Types.ObjectId(order_id),
          },
        },
        {
          $project: {
            productDetails: 1,
            orderId: 1,
          },
        },
      ])
    )[0];

    if (!order) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No order found with this ID."
      );
    }

    for (const item of warrantyInfo) {
      const findOrderItem = (order.productDetails as TProductDetails[]).find(
        (orderItem) => orderItem._id.toString() === item.itemId
      );
      if (findOrderItem?.quantity !== item.codes.length) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Please add all warranty codes"
        );
      }

      const warrantyData: TWarrantyData = {
        order_id,
        orderId: order.orderId,
        productId: findOrderItem.product,
        warrantyCodes: item.codes,
        // endsDate:89,
      };
      const warrantyRes = (
        await Warranty.create([warrantyData], { session })
      )[0];
      const updatedDoc = {
        $set: {
          "productDetails.$.warranty": warrantyRes._id,
        },
      };

      await Order.findOneAndUpdate(
        {
          _id: order_id,
          "productDetails._id": findOrderItem._id,
        },
        updatedDoc
      ).session(session);
    }

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
