import { Document, model, Schema } from "mongoose";
import { TDistrict } from "./district.types";

const DistrictSchema = new Schema<TDistrict & Document>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    bn_name: {
      type: String,
      required: true,
      unique: true,
    },
    division_id: {
      type: String,
      ref: "divisions",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const District = model<TDistrict & Document>(
  "districts",
  DistrictSchema
);
