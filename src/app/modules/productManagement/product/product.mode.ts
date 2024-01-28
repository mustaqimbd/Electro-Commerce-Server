import { Schema, model } from "mongoose";
import { TProduct } from "./product.interface";
import { TAttribute } from "../attribute/attribute.interface";
// import { TBrand } from '../brand/brand.interface';
// import { TCategory } from '../category/category.interface';
// import { TTag } from '../tag/tag.interface';

const productAttributeSchema = new Schema<TAttribute>(
  {
    _id: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    values: { type: [String], required: true },
  },
  { _id: false }
);

// const productBrandSchema = new Schema<TBrand>({
//     _id: { type: Schema.Types.ObjectId, required: true, unique: true },
//     name: { type: String, required: true },
// },
//     { _id: false }
// );

// const productCategorySchema = new Schema<TCategory>({
//     _id: { type: Schema.Types.ObjectId, required: true, unique: true },
//     name: { type: String, required: true },
// },
//     { _id: false }
// );

// const productTagSchema = new Schema<TTag>({
//     _id: { type: Schema.Types.ObjectId, required: true, unique: true },
//     name: { type: String, required: true },
// },
//     { _id: false }
// );

const productSchema = new Schema<TProduct>(
  {
    id: { type: String, require: true, unique: true },
    title: { type: String, required: true, unique: true },
    permalink: { type: String, unique: true },
    type: { type: String },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    downloadable: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    price: { type: Schema.Types.ObjectId, required: true, ref: "Price" },
    image: { type: Schema.Types.ObjectId, required: true, ref: "ProductImage" },
    inventory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Inventory",
    },
    attribute: { type: [productAttributeSchema], required: true },
    shipping: {
      type: { shippingConfiguration: { type: String, required: true } },
      required: true,
    },
    brand: { type: [{ type: Schema.Types.ObjectId, ref: "Brand" }] },
    category: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      required: true,
    },
    tag: { type: [{ type: Schema.Types.ObjectId, ref: "Tag" }] },
    seoData: { type: Schema.Types.ObjectId, ref: "SeoData" },
    publishedStatus: {
      status: { type: String, required: true },
      visibility: { type: String, required: true },
      date: { type: String, required: true },
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
