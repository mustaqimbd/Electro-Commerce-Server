import { Schema, model } from "mongoose";
import { TAttribute } from "./attribute.interface";

const brandSchema = new Schema<TAttribute>(
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

export const BrandModel = model<TAttribute>("Brand", brandSchema);
