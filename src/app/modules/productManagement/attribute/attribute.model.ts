import { Schema, model } from "mongoose";
import { TAttribute } from "./attribute.interface";

const attributeSchema = new Schema<TAttribute>(
  {
    name: { type: String, unique: true, sparse: true },
    values: { type: [String] },
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

export const AttributeModel = model<TAttribute>("Attribute", attributeSchema);
