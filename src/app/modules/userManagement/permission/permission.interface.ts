import { Document } from "mongoose";

export type TPermissionNames =
  | "super admin"
  | "manage permission"
  | "manage admin or staff"
  | "manage coupon"
  | "manage shipping charges"
  | "manage orders"
  | "manage warehouse"
  | "manage courier";

export type TPermissionData = {
  name: TPermissionNames;
};

export type TPermission = TPermissionData & Document;
