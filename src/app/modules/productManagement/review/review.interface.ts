import { Types } from "mongoose";

export type TReview = {
  product: Types.ObjectId;
  customer: Types.ObjectId;
  rating: number;
  comment: string;
  isDeleted: boolean;
};
