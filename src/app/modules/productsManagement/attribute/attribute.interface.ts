import { Types } from "mongoose";

export type TAttribute = {
  name: string;
  values: string[];
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
