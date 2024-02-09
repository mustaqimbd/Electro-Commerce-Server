import { Types } from "mongoose";
import { TAttribute } from "../attribute/attribute.interface";

export type TPublishedStatus = "Draft" | "Published";
export type TVisibilityStatus = "Public" | "Private" | "Password protected";
export type TPublishedStatusSchema = {
  status: TPublishedStatus;
  visibility: TVisibilityStatus;
  date: string;
};
export type TProductImage = {
  thumbnail: Types.ObjectId;
  gallery: Types.ObjectId[];
};
export type TCategorySchema = {
  _id: Types.ObjectId;
  subCategory?: Types.ObjectId[];
};

export type TProduct = {
  id: string;
  title: string;
  permalink?: string;
  type?: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  downloadable?: boolean;
  featured?: boolean;
  review?: boolean;
  price: Types.ObjectId;
  image: TProductImage; //| TProductImage
  inventory: Types.ObjectId; //| TInventory
  attribute: Partial<TAttribute>[];
  brand: Types.ObjectId[];
  category: TCategorySchema;
  tag: Types.ObjectId[];
  seoData: Types.ObjectId; // | TSeoData
  publishedStatus: TPublishedStatusSchema;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
};
