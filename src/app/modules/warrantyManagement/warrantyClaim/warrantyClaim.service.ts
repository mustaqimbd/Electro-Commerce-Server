import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TProductDetails } from "../../orderManagement/order/order.interface";
import { createNewOrder } from "../../orderManagement/order/order.utils";
import { TWarrantyClaim } from "./warrantyClaim.interface";
import { WarrantyClaim } from "./warrantyClaim.model";
import { WarrantyClaimUtils } from "./warrantyClaim.utils";

const getAllWarrantyClaimReqFromDB = async (query: Record<string, string>) => {
  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 1,
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
  const updatedDoc: Record<string, unknown> = {};

  if (payload.result) {
    updatedDoc.result = payload.result;
    updatedDoc.identifiedBy = user.id;
  }

  if (payload.shipping) {
    updatedDoc.shipping = payload.shipping;
  }

  if (payload.officialNotes) {
    updatedDoc.officialNotes = payload.officialNotes;
  }

  await WarrantyClaim.findByIdAndUpdate(
    id,
    { $set: updatedDoc },
    { new: true }
  );
};

const updateContactStatusIntoDB = async (
  warrantyClaimedReqIds: Types.ObjectId[],
  contactStatus: string
) => {
  const result = await WarrantyClaim.updateMany(
    { _id: { $in: warrantyClaimedReqIds } },
    { contactStatus },
    { upsert: true }
  );

  return result;
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
      "Please contact with the customer first"
    );
  }

  if (claimReq?.result !== "problem") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only problematic products will accept"
    );
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

  try {
    session.startTransaction();

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }

  const order = await createNewOrder({ body, user }, session, {
    warrantyClaim: true,
    productsDetails: claimReq?.warrantyClaimReqData?.map(
      ({
        productId,
        claimedCodes,
      }: {
        productId: Types.ObjectId;
        claimedCodes: string[];
      }) => ({
        product: productId,
        quantity: claimedCodes?.length,
      })
    ) as Partial<TProductDetails[]>,
  });

  await WarrantyClaim.findOneAndUpdate(
    { _id: id },
    { orderId: order._id, approvalStatus: "approved", finalCheckedBy: user.id },
    { session }
  );

  return order;
};

export const WarrantyClaimServices = {
  getAllWarrantyClaimReqFromDB,
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
  updateWarrantyClaimReqIntoDB,
  updateContactStatusIntoDB,
  createNewWarrantyClaimOrderIntoDB,
};
