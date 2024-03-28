import { TOrderSourceName, TOrderStatus } from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "processing",
  "On courier",
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
