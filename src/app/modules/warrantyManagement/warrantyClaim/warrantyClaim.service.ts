import { PipelineStage } from "mongoose";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TWarrantyClaim } from "./warrantyClaim.interface";
import { WarrantyClaim } from "./warrantyClaim.model";
import { getWarrantyData } from "./warrantyClaim.utils";

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
  const warranty = await getWarrantyData(phoneNumber, warrantyCodes);
  return warranty;
};

const createWarrantyClaimIntoDB = async (payload: TWarrantyClaim) => {
  const result = await WarrantyClaim.create(payload);
  return result;
};

export const WarrantyClaimServices = {
  getAllWarrantyClaimReqFromDB,
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
};
