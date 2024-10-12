import { Types } from "mongoose";
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

export const ImageToOrderService = { createIntoDB, getAllReqAdminFromDB };
