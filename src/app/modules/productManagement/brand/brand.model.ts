import { Schema, model } from "mongoose";
import { TBrand } from "./brand.interface";

const brandSchema = new Schema<TBrand>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const BrandModel = model<TBrand>("Brand", brandSchema);
