import { Types } from "mongoose";

export type TSubCategory = {
  name: string;
  category: Types.ObjectId;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
