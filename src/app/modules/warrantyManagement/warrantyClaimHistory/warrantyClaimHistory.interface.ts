import { Document, Types } from "mongoose";

export type TWCHClaims = {
  order_id: Types.ObjectId;
  itemId: Types.ObjectId;
  claimedCodes: string[];
};

export type TWarrantyClaimHistoryData = {
  parentOrder: Types.ObjectId;
  parentItemId: Types.ObjectId;
  claims: TWCHClaims[]; //TWCHClaim: T = type, W = warranty, C = claim, H = History
};

export type TWarrantyClaimHistory = TWarrantyClaimHistoryData & Document;
