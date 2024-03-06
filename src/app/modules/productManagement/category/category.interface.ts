import { Types } from "mongoose";

export type TCategory = {
  _id?: Types.ObjectId;
  name: string;
  image: Types.ObjectId;
  description: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
