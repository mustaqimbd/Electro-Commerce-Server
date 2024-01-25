import { Types } from "mongoose";

export type TTag = {
  name: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
