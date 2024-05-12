import httpStatus from "http-status";
import { PipelineStage } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { Order } from "../../orderManagement/order/order.model";
import { createOrderId } from "../../orderManagement/order/order.utils";
import { WarrantyClaim } from "./warrantyClaim.model";

const getWarrantyData = async (
  phoneNumber: string,
  warrantyCodes: string[]
) => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "shippings",
        localField: "shipping",
        foreignField: "_id",
        as: "shippingData",
      },
    },
    {
      $unwind: "$shippingData",
    },
    {
      $match: {
        "shippingData.phoneNumber": phoneNumber,
      },
    },
    {
      $project: {
        _id: 1,
        orderId: 1,
        shipping: {
          fullName: "$shippingData.fullName",
          phoneNumber: "$shippingData.phoneNumber",
          fullAddress: "$shippingData.fullAddress",
        },
        shippingCharge: {
          name: "$shippingCharge.name",
          amount: "$shippingCharge.amount",
        },
        productDetails: 1,
        createdAt: 1,
      },
    },
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
        orderId: 1,
        product: {
          _id: "$productDetails._id",
          productId: "$productInfo._id",
          title: "$productInfo.title",
          image: { src: "$productThumb.src", alt: "$productThumb.alt" },
          warranty: {
            duration: "$warranty.duration",
            startDate: "$warranty.startDate",
            endsDate: "$warranty.endsDate",
            warrantyCodes: "$warranty.warrantyCodes",
          },
          unitPrice: "$productDetails.unitPrice",
          quantity: "$productDetails.quantity",
        },
        createdAt: 1,
      },
    },
    {
      $match: {
        "product.warranty.warrantyCodes.code": { $in: warrantyCodes },
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
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        orderId: 1,
        products: 1,
      },
    },
  ];
  const order = await Order.aggregate(pipeline);
  if (!order)
    throw new ApiError(httpStatus.BAD_REQUEST, "No warranty data found");
  return order;
};

const ifAlreadyClaimRequestPending = async (phoneNumber: string) => {
  const result = await WarrantyClaim.countDocuments({
    phoneNumber,
    contactStatus: "pending",
  });
  if (result) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Dear valued customer, your another warranty claim request has already been pending. After completing that request, you can claim a new warranty."
    );
  }
};

const createReqID = () => createOrderId();

export const WarrantyClaimUtils = {
  ifAlreadyClaimRequestPending,
  getWarrantyData,
  createReqID,
};
