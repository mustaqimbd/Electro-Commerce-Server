import { Document, Types } from "mongoose";
import { TImage } from "../productManagement/image/image.interface";
import { TUser } from "../userManagement/user/user.interface";

export type TPaymentMethodMerchantACInfo = {
  accountType: string;
  accountNo: string;
};

export type TPaymentMethod = {
  name: string;
  image: Types.ObjectId | TImage;
  description: string;
  merchantACInfo?: TPaymentMethodMerchantACInfo;
  isPaymentDetailsNeeded: boolean;
  createdBy: Types.ObjectId | TUser;
  isDeleted: boolean;
} & Document;
