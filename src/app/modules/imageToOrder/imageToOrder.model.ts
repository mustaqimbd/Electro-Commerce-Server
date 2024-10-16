import { model, Schema } from "mongoose";
import { ShippingSchema } from "../orderManagement/shipping/shipping.model";
import { ImageToOrderConst } from "./imageToOrder.const";
import { TImageToOrder } from "./imageToOrder.interface";

const ImageToOrderSchema = new Schema<TImageToOrder>(
  {
    reqId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
    },
    shipping: ShippingSchema,
    images: {
      type: [
        {
          path: {
            type: String,
          },
        },
      ],
      required: true,
    },
    customerNotes: {
      type: String,
    },
    officialNote: {
      type: String,
    },
    contactStatus: {
      type: String,
      enum: ImageToOrderConst.contactStatusEnum,
    },
    status: {
      type: String,
      enum: ImageToOrderConst.statusEnum,
    },
    orderId: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ImageToOrder = model<TImageToOrder>(
  "image_to_order_requests",
  ImageToOrderSchema
);
