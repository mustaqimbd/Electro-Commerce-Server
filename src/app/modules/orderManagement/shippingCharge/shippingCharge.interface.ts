import mongoose, { Document } from "mongoose";
import { TUser } from "../../userManagement/user/user.interface";

export type TShippingChargeData = {
  name: string;
  description: string;
  amount: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId | TUser;
};

export type TShippingCharge = TShippingChargeData & Document;
