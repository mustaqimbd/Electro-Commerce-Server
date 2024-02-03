import { TOrderStatus } from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "processing",
  "picked by courier",
  "completed",
  "canceled",
];
