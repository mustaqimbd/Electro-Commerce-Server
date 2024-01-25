import { Schema, model } from "mongoose";
import { TTag } from "./tag.interface";

const tagSchema = new Schema<TTag>(
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

export const TagModel = model<TTag>("Tag", tagSchema);
