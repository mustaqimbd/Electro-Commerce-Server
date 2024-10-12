import fsEx from "fs-extra";
import httpStatus from "http-status";
import { Types } from "mongoose";
import path from "path";
import ApiError from "../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../types/common";
import optionalAuthUserQuery from "../../types/optionalAuthUserQuery";
import { TImageToOrder } from "./imageToOrder.interface";
import { ImageToOrder } from "./imageToOrder.model";
import { ImageToOrderUtils } from "./imageToOrder.utils";

const createIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: TImageToOrder
) => {
  payload.reqId = ImageToOrderUtils.createReqId();
  const userQuery = optionalAuthUserQuery(user);
  if (userQuery.userId) userQuery.userId = new Types.ObjectId(userQuery.userId);
  payload.officialNote = undefined;
  payload.contactStatus = "pending";
  payload.status = "pending";
  payload.orderId = undefined;
  const result = await ImageToOrder.create(payload);
  return result;
};

const getAllReqAdminFromDB = async () => {
  const result = await ImageToOrder.find();
  return result;
};

const updateReqByAdminIntoDB = async (
  reqId: Types.ObjectId,
  payload: TImageToOrder
) => {
  const existingData = await ImageToOrder.findById(reqId);

  const updatedDoc: Partial<TImageToOrder> = {};
  if (payload.contactStatus) updatedDoc.contactStatus = payload.contactStatus;
  if (payload.status) {
    updatedDoc.status = payload.status;

    if (existingData?.contactStatus !== "confirmed") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Please contact to the customer first"
      );
    }
    if (payload.status === "canceled") {
      updatedDoc.images = [];
      if (existingData?.images?.length) {
        existingData?.images?.forEach((item) => {
          try {
            const folderPath = path.parse(item.path).dir;
            fsEx.remove(folderPath);
            // eslint-disable-next-line no-empty
          } finally {
          }
        });
      }
    }
  }
  const result = await ImageToOrder.findOneAndUpdate(
    { _id: existingData?._id },
    updatedDoc,
    { new: true }
  );
  return result;
};

export const ImageToOrderService = {
  createIntoDB,
  getAllReqAdminFromDB,
  updateReqByAdminIntoDB,
};
