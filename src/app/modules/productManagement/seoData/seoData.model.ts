import { Schema, model } from "mongoose";
import { TSeoData } from "./seoData.interface";

const SeoDataSchema = new Schema<TSeoData>(
  {
    focusKeyphrase: { type: String, required: true },
    metaTitle: { type: String, required: true },
    slug: { type: String, required: true },
    metaDescription: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SeoDataModel = model<TSeoData>("SeoData", SeoDataSchema);
