import { Document, Types } from "mongoose";
import { IAdmins } from "../admins/admins.interface";
import { ICustomers } from "../customers/customers.interface";
import { IStaffs } from "../staffs/staff.interface";

export type roles = "customer" | "staff" | "admin";

export type IUser = {
  id: string;
  role: roles;
  phoneNumber: string;
  email?: string;
  password: string;
  customer: Types.ObjectId | ICustomers;
  staff: Types.ObjectId | IStaffs;
  admin: Types.ObjectId | IAdmins;
  isDeleted: boolean;
  status: boolean;
} & Document;
