import { Schema, model } from "mongoose";
import { TImage, TProductImage } from "./productImage.interface";

const imageSchema = new Schema<TImage>(
  {
    src: { type: String, required: true },
    alt: { type: String },
  },
  { _id: false }
);

const productImageSchema = new Schema<TProductImage>(
  {
    thumbnail: imageSchema,
    gallery: {
      type: [imageSchema],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ProductImageModel = model<TProductImage>(
  "ProductImage",
  productImageSchema
);
