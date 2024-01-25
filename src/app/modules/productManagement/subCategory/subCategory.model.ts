import { Schema, model } from "mongoose";
import { TSubCategory } from "./subCategory.interface";

const subCategorySchema = new Schema<TSubCategory>(
  {
    name: { type: String, required: true, unique: true },
    category: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
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

export const SubCategoryModel = model<TSubCategory>(
  "SubCategory",
  subCategorySchema
);
