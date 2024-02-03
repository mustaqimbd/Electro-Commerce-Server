import { Schema, model } from "mongoose";
import { TPrice } from "./price.interface";

const priceSchema = new Schema<TPrice>(
  {
    regularPrice: { type: Number, required: true },
    salePrice: { type: Number },
    discountPercent: { type: Number },
    date: {
      start: { type: String },
      end: { type: String },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PriceModel = model<TPrice>("Price", priceSchema);

export default PriceModel;
