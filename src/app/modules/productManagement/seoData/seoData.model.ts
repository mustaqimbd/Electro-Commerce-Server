import { Schema, model } from "mongoose";
import { TSeoData } from "./seoData.interface";

const SeoDataSchema = new Schema<TSeoData>(
  {
    focusKeyphrase: { type: String },
    metaTitle: { type: String },
    slug: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SeoDataModel = model<TSeoData>("SeoData", SeoDataSchema);
