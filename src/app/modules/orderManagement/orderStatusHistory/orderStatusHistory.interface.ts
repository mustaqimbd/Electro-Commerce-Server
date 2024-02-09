import mongoose, { Document } from "mongoose";
import { TUser } from "../../userManagement/user/user.interface";
import { TOrderStatus } from "../order/order.interface";

export type TStatusHistory = {
  updatedBy?: mongoose.Types.ObjectId | TUser;
  status?: TOrderStatus;
};

export type TOrderStatusHistoryData = {
  orderId: string;
  message?: string;
  refunded?: boolean;
  history: [TStatusHistory];
};

export type TOrderStatusHistory = TOrderStatusHistoryData & Document;
