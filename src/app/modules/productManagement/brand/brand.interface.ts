import { Types } from "mongoose";

export type TBrand = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  logo?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
