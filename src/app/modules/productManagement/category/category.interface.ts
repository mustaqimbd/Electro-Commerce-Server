import { Types } from "mongoose";

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
