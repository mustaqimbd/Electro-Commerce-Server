import { Types } from "mongoose";

export type TAttribute = {
  name: string;
  values: string[];
  deleteValue?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
