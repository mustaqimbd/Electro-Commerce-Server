import { Document } from "mongoose";

export type ICustomers = {
  uid: string;
  fullName?: string;
  fullAddress?: string;
} & Document;
