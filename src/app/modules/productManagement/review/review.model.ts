import { Schema, model } from "mongoose";
import { TReview } from "./review.interface";

const reviewSchema = new Schema<TReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ReviewModel = model<TReview>("Review", reviewSchema);
