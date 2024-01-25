import { Types } from "mongoose";

export type TBrand = {
  name: string;
  description?: string;
  logo?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
