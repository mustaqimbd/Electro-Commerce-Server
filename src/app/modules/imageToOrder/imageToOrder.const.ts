import {
  TImageToOrderContactStatus,
  TImageToOrderStatus,
} from "./imageToOrder.interface";

const contactStatusEnum: TImageToOrderContactStatus[] = [
  "confirmed",
  "pending",
  "retry required",
];

const statusEnum: TImageToOrderStatus[] = [
  "pending",
  "confirmed",
  "canceled",
  "completed",
];

export const ImageToOrderConst = {
  contactStatusEnum,
  statusEnum,
};
