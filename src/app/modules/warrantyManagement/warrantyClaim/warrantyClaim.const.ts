import {
  TWarrantyApprovalStatus,
  TWarrantyClaimedContactStatus,
  TWarrantyClaimedProductCondition,
} from "./warrantyClaim.interface";

export const warrantyClaimedContactStatus: TWarrantyClaimedContactStatus[] = [
  "pending",
  "confirm",
  "retry required",
];

export const warrantyClaimedProductCondition: TWarrantyClaimedProductCondition[] =
  ["problem", "solved"];

export const warrantyApprovalStatus: TWarrantyApprovalStatus[] = ["approved"];
