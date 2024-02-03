import mongoose, { Document } from "mongoose";
import { TUser } from "../../userManagement/user/user.interface";

export type TShippingChargeData = {
  name: string;
  description: string;
  amount: number;
  createdBy: mongoose.Types.ObjectId | TUser;
};

export type TShippingCharge = TShippingChargeData & Document;
