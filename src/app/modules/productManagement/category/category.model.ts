import { Schema, model } from "mongoose";
import { TCategory } from "./category.interface";

const categorySchema = new Schema<TCategory>(
  {
    name: { type: String, required: true, unique: true },
    parentCategory: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Parent_Category",
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

export const CategoryModel = model<TCategory>("Category", categorySchema);
