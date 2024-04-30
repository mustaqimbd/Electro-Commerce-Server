import {
  TWarrantyApprovalStatus,
  TWarrantyClaimedContactStatus,
  TWarrantyClaimedProductCondition,
  TWarrantyClaimedProductLocation,
} from "./warrantyClaim.interface";

export const warrantyClaimedContactStatus: TWarrantyClaimedContactStatus[] = [
  "waiting",
  "confirm",
];

export const warrantyClaimedProductCondition: TWarrantyClaimedProductCondition[] =
  ["problem"];

export const warrantyClaimedProductLocation: TWarrantyClaimedProductLocation[] =
  ["has been sent"];

export const warrantyApprovalStatus: TWarrantyApprovalStatus[] = ["approved"];
