import { Types } from "mongoose";

export type TPrice = {
  regularPrice: number;
  salePrice?: number;
  discountPercent?: number;
  save?: number;
  date?: {
    start: string;
    end: string;
  };
  updatedBy?: Types.ObjectId;
};
