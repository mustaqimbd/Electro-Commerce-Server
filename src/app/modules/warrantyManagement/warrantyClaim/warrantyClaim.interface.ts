import mongoose from "mongoose";
import { TOrder } from "../../orderManagement/order/order.interface";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TUser } from "../../userManagement/user/user.interface";

export type TContactStatus = "waiting" | "confirm";
export type TWarrantyClaimedProductStatus = "problem";
export type TWarrantyApprovalStatus = "approve";

export type TWarrantyClaim = {
  order_id: mongoose.Types.ObjectId | TOrder;
  orderId: string;
  shipping: TShipping;
  contactStatus: TContactStatus;
  identifiedBy: mongoose.Types.ObjectId | TUser;
  result: TWarrantyClaimedProductStatus;
  productLocation: TWarrantyClaimedProductStatus;
  approvalStatus: TWarrantyApprovalStatus;
  finalCheckedBy: mongoose.Types.ObjectId | TUser;
};
