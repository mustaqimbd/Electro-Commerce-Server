import { Document, Model, Types } from "mongoose";
import { TAdmin } from "../admin/admin.interface";
import { TCustomer } from "../customer/customer.interface";
import { IStaffs } from "../staff/staff.interface";

export type roles = "customer" | "staff" | "admin";

export type TUser = {
  id: string;
  role: roles;
  phoneNumber: string;
  email?: string;
  password: string;
  customer: Types.ObjectId | TCustomer;
  staff: Types.ObjectId | IStaffs;
  admin: Types.ObjectId | TAdmin;
  isDeleted: boolean;
  status: boolean;
} & Document;

export type TUserModel = {
  isPasswordMatch(
    givenPassWord: string,
    savedPassword: string,
  ): Promise<boolean>;
} & Model<TUser>;
