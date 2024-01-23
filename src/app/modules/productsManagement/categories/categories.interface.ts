import { Types } from "mongoose";

export type TCategory = {
  categoryName: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
