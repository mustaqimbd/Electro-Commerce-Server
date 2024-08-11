import { Schema, model } from "mongoose";
import { TCategory } from "./category.interface";

// const subcategorySchema = new Schema<TCategory>({
//   name: { type: String, required: true, unique: true },
//   slug: { type: String, required: true, unique: true },
//   image: { type: Schema.Types.ObjectId, ref: "Image" },
//   description: { type: String },
//   isDeleted: { type: Boolean, default: false },
// });

const categorySchema = new Schema<TCategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: Schema.Types.ObjectId, ref: "Image" },
    description: { type: String },
    // subcategories: [subcategorySchema],
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

categorySchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" ");
  }
  next();
});

export const CategoryModel = model<TCategory>("Category", categorySchema);
