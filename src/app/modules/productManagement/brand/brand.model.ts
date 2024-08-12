import { Schema, model } from "mongoose";
import { TBrand } from "./brand.interface";
import { ImageModel } from "../../image/image.model";
import ApiError from "../../../errorHandlers/ApiError";
import httpStatus from "http-status";

const brandSchema = new Schema<TBrand>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: Schema.Types.ObjectId, ref: "Image" },
    description: { type: String },
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

brandSchema.pre("save", async function (next) {
  if (this.name) {
    this.name = this.name
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase() // Convert the entire string to lowercase
      .split(" ") // Split the string into an array of words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(" "); // Convert to lowercase for uniqueness
  }
  if (this.logo) {
    const isImageExist = await ImageModel.findById(this.logo);
    if (!isImageExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "The image was not found!");
    }
    if (isImageExist.isDeleted) {
      throw new ApiError(httpStatus.BAD_REQUEST, "The image is deleted!");
    }
  }
  next();
});

export const BrandModel = model<TBrand>("Brand", brandSchema);
