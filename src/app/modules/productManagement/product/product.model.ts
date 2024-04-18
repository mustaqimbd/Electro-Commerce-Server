import { Schema, model } from "mongoose";
import {
  TCategorySchema,
  TProduct,
  TProductImage,
  TPublishedStatusSchema,
  TWarrantyInfo,
} from "./product.interface";
import { TAttribute } from "../attribute/attribute.interface";
import { publishedStatus, visibilityStatus } from "./product.const";

const productImageSchema = new Schema<TProductImage>(
  {
    thumbnail: { type: Schema.Types.ObjectId, required: true, ref: "Image" },
    gallery: {
      type: [{ type: Schema.Types.ObjectId, required: true, ref: "Image" }],
      required: true,
    },
  },
  { _id: false }
);
const productAttributeSchema = new Schema<TAttribute>(
  {
    name: { type: String },
    values: { type: [String] },
  },
  { _id: false }
);
const publishedStatusSchema = new Schema<TPublishedStatusSchema>(
  {
    status: { type: String, enum: publishedStatus, required: true },
    visibility: { type: String, enum: visibilityStatus, required: true },
    date: { type: String, required: true },
  },
  { _id: false }
);
const categorySchema = new Schema<TCategorySchema>(
  {
    _id: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    subCategory: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "SubCategory",
        },
      ],
    },
  },
  { _id: false }
);

const warrantyInfoSchema = new Schema<TWarrantyInfo>(
  {
    duration: { type: String },
    terms: { type: String },
  },
  { _id: false }
);

const productSchema = new Schema<TProduct>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, unique: true },
    permalink: { type: String, unique: true, sparse: true },
    type: { type: String },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    shortDescription: { type: String },
    downloadable: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    review: { type: Boolean, default: false },
    price: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Price",
    },
    image: {
      type: productImageSchema,
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Inventory",
    },
    attribute: {
      type: [productAttributeSchema],
    },
    brand: {
      type: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
    },
    category: categorySchema,
    warranty: { type: Boolean, required: true },
    warrantyInfo: {
      type: warrantyInfoSchema,
    },
    tag: {
      type: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    },
    publishedStatus: {
      type: publishedStatusSchema,
      required: true,
    },
    seoData: {
      type: Schema.Types.ObjectId,
      ref: "SeoData",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const ProductModel = model<TProduct>("Product", productSchema);

export default ProductModel;
