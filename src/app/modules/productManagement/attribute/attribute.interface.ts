import { Types } from "mongoose";

export type TAttribute = {
  _id?: Types.ObjectId;
  name: string;
  values: string[];
  deleteValue?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
