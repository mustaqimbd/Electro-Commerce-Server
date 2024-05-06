import {
  TWarrantyApprovalStatus,
  TWarrantyClaimedContactStatus,
  TWarrantyClaimedProductCondition,
} from "./warrantyClaim.interface";

export const warrantyClaimedContactStatus: TWarrantyClaimedContactStatus[] = [
  "pending",
  "confirmed",
  "retry required",
];

export const warrantyClaimedProductCondition: TWarrantyClaimedProductCondition[] =
  ["problem", "solved"];

export const warrantyApprovalStatus: TWarrantyApprovalStatus[] = ["approved"];
