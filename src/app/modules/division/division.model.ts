import { Document, model, Schema } from "mongoose";
import { TDivision } from "./division.types";

const DivisionSchema = new Schema<TDivision & Document>(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      immutable: true,
    },
    name: {
      type: String,
      unique: true,
      required: true,
    },
    bn_name: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Division = model<TDivision & Document>(
  "divisions",
  DivisionSchema
);
