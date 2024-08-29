import { Types } from "mongoose";

export type TPrice = {
  regularPrice: number;
  salePrice?: number;
  discountPercent?: number;
  priceSave?: number;
  date?: {
    start: string;
    end: string;
  };
  updatedBy?: Types.ObjectId;
};
