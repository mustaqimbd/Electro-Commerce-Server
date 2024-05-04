import mongoose, { Document, Types } from "mongoose";
import { TProductDetails } from "../../orderManagement/order/order.interface";
import { TShipping } from "../../orderManagement/shipping/shipping.interface";
import { TUser } from "../../userManagement/user/user.interface";

export type TWarrantyClaimedContactStatus =
  | "pending"
  | "confirm"
  | "retry required";
export type TWarrantyClaimedProductCondition = "solved" | "problem";
export type TWarrantyApprovalStatus = "approved";
export type TWarrantyClaimedVideosAndImages = {
  path: string;
  fileType: string;
};
export type TWarrantyClaimReqData = {
  order_id: Types.ObjectId;
  orderItemId: Types.ObjectId | TProductDetails;
  claimedCodes: string[];
};

export type TWarrantyClaimData = {
  shipping: TShipping;
  problemInDetails: string;
  videosAndImages: TWarrantyClaimedVideosAndImages[];
  warrantyClaimReqData: TWarrantyClaimReqData[];
  contactStatus: TWarrantyClaimedContactStatus;
  result: TWarrantyClaimedProductCondition;
  identifiedBy: mongoose.Types.ObjectId | TUser;
  approvalStatus: TWarrantyApprovalStatus;
  finalCheckedBy: mongoose.Types.ObjectId | TUser;
};

export type TWarrantyClaim = TWarrantyClaimData & Document;
