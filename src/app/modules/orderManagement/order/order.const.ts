import { TOrderSourceName, TOrderStatus } from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "On courier",
  "picked by courier",
  "completed",
  "canceled",
  "follow up",
  "returned",
  "deleted",
];

export const orderSources: TOrderSourceName[] = [
  "Website",
  "Landing Page",
  "App",
  "Phone Call",
  "Social Media",
  "From Office",
];
