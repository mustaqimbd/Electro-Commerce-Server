import { Types } from "mongoose";
import { TAttribute } from "../attribute/attribute.interface";
// import { TPrice } from "../price/price.interface";
// import { TProductImage } from "../productImage/productImage.interface";
// import { TInventory } from "../inventory/inventory.interface";
// import { TSeoData } from "../seoData/seoData.interface";
// import { TBrand } from "../brand/brand.interface";
// import { TCategory } from "../category/category.interface";
// import { TTag } from "../tag/tag.interface";

// export type TProductAttribute = {
//     _id: Types.ObjectId;
//     name: string;
//     values: string[];
// }

// export type TProductBrand = {
//     _id: Types.ObjectId;
//     name: string;
// }

// export type TProductCategory = {
//     _id: Types.ObjectId;
//     name: string;
// }

// export type TProductTag = {
//     _id: Types.ObjectId;
//     tag: string;
// }

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
  price: Types.ObjectId;
  image: Types.ObjectId; //| TProductImage
  inventory: Types.ObjectId; //| TInventory
  attribute: Partial<TAttribute>[];
  shipping: {
    shippingConfiguration: string;
  };
  brand: Types.ObjectId[];
  category: Types.ObjectId[];
  tag: Types.ObjectId[];
  seoData: Types.ObjectId; // | TSeoData
  publishedStatus: {
    status: string;
    visibility: string;
    date: string;
  };
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  deletedBy: Types.ObjectId;
  isDeleted: boolean;
};
