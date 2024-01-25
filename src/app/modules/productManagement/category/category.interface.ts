import { Types } from "mongoose";

export type TCategory = {
  name: string;
  parentCategory: Types.ObjectId;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
