import { Types } from "mongoose";
import { TAttribute } from "../attribute/attribute.interface";

export type TPublishedStatus = "Draft" | "Published";
export type TVisibilityStatus = "Public" | "Password protected" | "Private";
export type TPublishedStatusSchema = {
  status: TPublishedStatus;
  visibility: TVisibilityStatus;
  date: string;
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
  image: Types.ObjectId; //| TProductImage
  inventory: Types.ObjectId; //| TInventory
  attribute: Partial<TAttribute>[];
  brand: Types.ObjectId[];
  category: Types.ObjectId[];
  tag: Types.ObjectId[];
  seoData: Types.ObjectId; // | TSeoData
  publishedStatus: TPublishedStatusSchema;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
};
