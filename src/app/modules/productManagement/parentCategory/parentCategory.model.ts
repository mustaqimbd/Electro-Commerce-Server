import { Schema, model } from "mongoose";
import { TParentCategory } from "./parentCategory.interface";

const parentCategorySchema = new Schema<TParentCategory>(
  {
    name: { type: String, required: true, unique: true },
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

export const ParentCategoryModel = model<TParentCategory>(
  "Parent_Category",
  parentCategorySchema
);
