import httpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
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
  const result = await WarrantyClaim.create(payload);
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
  if (payload.contactStatus) {
    updatedDoc.contactStatus = payload.contactStatus;
    updatedDoc.result = payload.result;
    updatedDoc.identifiedBy = user.id;
  }

  if (payload.shipping) {
    updatedDoc.shipping = payload.shipping;
  }

  if (payload.officialNotes) {
    updatedDoc.officialNotes = payload.officialNotes;
  }

  if (payload.approvalStatus) {
    updatedDoc.approvalStatus = payload.approvalStatus;
    updatedDoc.finalCheckedBy = user.id;
  }
  await WarrantyClaim.findByIdAndUpdate(
    id,
    { $set: updatedDoc },
    { new: true }
  );
};

export const WarrantyClaimServices = {
  getAllWarrantyClaimReqFromDB,
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
  updateWarrantyClaimReqIntoDB,
};
