import { Document, Types } from "mongoose";
import { ICustomers } from "../customers/customers.interface";

export type roles = "customer" | "staff" | "admin";

export type IUser = {
  id: string;
  role: roles;
  phoneNumber: string;
  email?: string;
  password: string;
  customer: Types.ObjectId | ICustomers;
  staff: Types.ObjectId;
  admin: Types.ObjectId;
  isDeleted: boolean;
  status: boolean;
} & Document;
