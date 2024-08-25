import fsEx from "fs-extra";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import path from "path";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { createNewOrder } from "../../orderManagement/order/order.utils";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TVariation } from "../../productManagement/product/product.interface";
import {
  TWarrantyClaim,
  TWarrantyClaimedContactStatus,
  TWarrantyClaimedProductCondition,
  TWarrantyClaimedProductDetails,
  TWarrantyClaimReqData,
} from "./warrantyClaim.interface";
import { WarrantyClaim } from "./warrantyClaim.model";
import { WarrantyClaimUtils } from "./warrantyClaim.utils";
const getAllWarrantyClaimReqFromDB = async (query: Record<string, string>) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        approvalStatus: { $ne: "approved" },
        result: { $ne: "solved" },
      },
    },
    {
      $project: {
        _id: 1,
        reqId: 1,
        shipping: {
          fullName: "$shipping.fullName",
          phoneNumber: "$shipping.phoneNumber",
          fullAddress: "$shipping.fullAddress",
        },
        problemInDetails: 1,
        videosAndImages: 1,
        warrantyClaimReqData: 1,
        contactStatus: 1,
        result: 1,
        approvalStatus: 1,
        officialNotes: 1,
        createdAt: 1,
      },
    },
  ];
  const resultQuery = new AggregateQueryHelper(
    WarrantyClaim.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await resultQuery.model;
  const total = (await WarrantyClaim.aggregate(pipeline)).length;
  const meta = resultQuery.metaData(total);
  return { data, meta };
};

const checkWarrantyFromDB = async (
  phoneNumber: string,
  warrantyCodes: string[]
) => {
  await WarrantyClaimUtils.ifAlreadyClaimRequestPending(phoneNumber);
  const warranty = (
    await WarrantyClaimUtils.getWarrantyData(phoneNumber, warrantyCodes)
  ).map((item) => ({
    ...item,
  }));

  return warranty;
};

const createWarrantyClaimIntoDB = async (payload: TWarrantyClaim) => {
  const reqId = WarrantyClaimUtils.createReqID();
  const result = await WarrantyClaim.create({ ...payload, reqId });
  return result;
};

const updateWarrantyClaimReqIntoDB = async (
  id: Types.ObjectId,
  payload: Record<string, unknown>,
  user: TJwtPayload
) => {
  const warrantyClaimReq = await WarrantyClaim.findById(id);
  if (!warrantyClaimReq)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No warranty claim request found"
    );

  const { warrantyClaimReqData, shipping } = payload as {
    warrantyClaimReqData: string[];
    shipping: Partial<TShipping>;
  };

  if (payload.contactStatus) {
    warrantyClaimReq.contactStatus =
      payload.contactStatus as TWarrantyClaimedContactStatus;
  }

  if (payload.result) {
    if (!["confirmed"].includes(warrantyClaimReq.contactStatus)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please contact the customer first."
      );
    }
    warrantyClaimReq.result =
      payload.result as TWarrantyClaimedProductCondition;
    warrantyClaimReq.identifiedBy = user.id;
    if (payload.result === "solved") {
      if (warrantyClaimReq?.videosAndImages?.length) {
        warrantyClaimReq?.videosAndImages?.forEach((item) => {
          try {
            const folderPath = path.parse(item.path).dir;
            fsEx.remove(folderPath);
            // eslint-disable-next-line no-empty
          } finally {
          }
        });
      }
      warrantyClaimReq.videosAndImages = [];
    }
  }

  if (payload.shipping) {
    const newShipping = {
      fullName: shipping.fullName ?? warrantyClaimReq.shipping.fullName,
      fullAddress:
        shipping.fullAddress ?? warrantyClaimReq.shipping.fullAddress,
      phoneNumber:
        shipping.phoneNumber ?? warrantyClaimReq.shipping.phoneNumber,
    };

    warrantyClaimReq.shipping = newShipping as unknown as TShipping;
  }

  if (payload.officialNotes || payload.officialNotes === "") {
    warrantyClaimReq.officialNotes = payload.officialNotes as string;
  }

  if ((warrantyClaimReqData || []).length) {
    const claimReqData = await WarrantyClaimUtils.validateWarranty({
      phoneNumber: warrantyClaimReq.phoneNumber,
      warrantyCodes: warrantyClaimReqData,
    });

    warrantyClaimReq.warrantyClaimReqData =
      claimReqData as TWarrantyClaimReqData[];
  }
  await warrantyClaimReq.save();
};

const createNewWarrantyClaimOrderIntoDB = async (
  id: Types.ObjectId,
  payload: Record<string, unknown>,
  user: TJwtPayload
) => {
  const claimReq = await WarrantyClaim.findById(id);
  if (claimReq?.orderId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This request is already approved and also created an order"
    );
  }

  if (!claimReq) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No warranty claim request found"
    );
  }

  if (claimReq?.contactStatus !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Please contact the customer first"
    );
  }

  if (claimReq?.result !== "problem") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only problematic products will accept"
    );
  }

  if (claimReq?.videosAndImages?.length) {
    claimReq?.videosAndImages?.forEach((item) => {
      try {
        const folderPath = path.parse(item.path).dir;
        fsEx.remove(folderPath);
        // eslint-disable-next-line no-empty
      } finally {
      }
    });
  }

  const body = {
    ...payload,
    shipping: {
      fullName: claimReq?.shipping?.fullName,
      phoneNumber: claimReq?.shipping?.phoneNumber,
      fullAddress: claimReq?.shipping?.fullAddress,
    },
    orderSource: {
      name: "Warranty Claimed",
    },
  };

  const session = await mongoose.startSession();
  let order;
  try {
    session.startTransaction();
    order = await createNewOrder({ body, user }, session, {
      warrantyClaim: true,
      productsDetails: claimReq?.warrantyClaimReqData?.map(
        ({
          productId,
          claimedCodes,
          variation,
        }: {
          productId: Types.ObjectId;
          claimedCodes: string[];
          variation: Types.ObjectId | TVariation;
        }) => ({
          product: productId,
          quantity: claimedCodes?.length,
          variation: new Types.ObjectId(variation.toString()),
          claimedCodes: claimedCodes.map((item) => ({ code: item })),
        })
      ) as Partial<TWarrantyClaimedProductDetails[]>,
    });

    await WarrantyClaim.findOneAndUpdate(
      { _id: id },
      {
        orderId: order._id,
        approvalStatus: "approved",
        finalCheckedBy: user.id,
      },
      { session }
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  claimReq.videosAndImages = undefined;
  await claimReq.save();

  return order;
};

export const WarrantyClaimServices = {
  getAllWarrantyClaimReqFromDB,
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
  updateWarrantyClaimReqIntoDB,
  createNewWarrantyClaimOrderIntoDB,
};
