import { Document } from "mongoose";

export type TPermissionNames =
  | "create permission"
  | "create admin or staff"
  | "create coupon";

export type TPermissionData = {
  name: TPermissionNames;
};

export type TPermission = TPermissionData & Document;
