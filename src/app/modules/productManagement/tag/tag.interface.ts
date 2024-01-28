import { Types } from "mongoose";

export type TTag = {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
