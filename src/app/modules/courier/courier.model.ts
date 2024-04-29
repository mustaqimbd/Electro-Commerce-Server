import mongoose, { Schema, model } from "mongoose";
import { TCourier } from "./courier.interface";

const CourierSchema = new Schema<TCourier>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  website: {
    type: String,
  },
  credentials: {
    type: [[String]],
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
});

export const Courier = model<TCourier>("Courier", CourierSchema);
