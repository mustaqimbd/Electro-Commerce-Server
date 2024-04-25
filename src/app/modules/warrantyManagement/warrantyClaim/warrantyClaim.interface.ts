import mongoose from "mongoose";
import { TOrder } from "../../orderManagement/order/order.interface";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TUser } from "../../userManagement/user/user.interface";

export type TWarrantyClaimedContactStatus = "waiting" | "confirm";
export type TWarrantyClaimedProductCondition = "problem";
export type TWarrantyClaimedProductLocation = "has been sent";
export type TWarrantyApprovalStatus = "approved";

export type TWarrantyClaim = {
  order_id: mongoose.Types.ObjectId | TOrder;
  orderId: string;
  shipping: TShipping;
  contactStatus: TWarrantyClaimedContactStatus;
  identifiedBy: mongoose.Types.ObjectId | TUser;
  result: TWarrantyClaimedProductCondition;
  productLocation: TWarrantyClaimedProductLocation;
  approvalStatus: TWarrantyApprovalStatus;
  finalCheckedBy: mongoose.Types.ObjectId | TUser;
};
