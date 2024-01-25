import { Types } from "mongoose";

export type TParentCategory = {
  name: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
