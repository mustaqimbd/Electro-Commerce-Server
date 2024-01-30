import { Types } from "mongoose";

export type TPrice = {
  regularPrice: number;
  salePrice?: number;
  discount?: number;
  date?: {
    start: string;
    end: string;
  };
  updatedBy?: Types.ObjectId;
};
