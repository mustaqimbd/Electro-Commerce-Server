import { Document } from "mongoose";

export type TPermissionNames =
  | "manage permission"
  | "manage admin or staff"
  | "manage coupon"
  | "manage shipping charges"
  | "manage orders";

export type TPermissionData = {
  name: TPermissionNames;
};

export type TPermission = TPermissionData & Document;
