import { Schema, model } from "mongoose";
import { TCategory } from "./categories.interface";

const categorySchema = new Schema<TCategory>(
  {
    categoryName: { type: String, required: true, unique: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

export const CategoryModel = model<TCategory>("Category", categorySchema);
