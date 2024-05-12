import { TOrderSourceName, TOrderStatus } from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "wco processing",
  "follow up",
  "processing done",
  "warranty added",
  "On courier",
  "canceled",
  "returned",
  "partly returned",
  "completed",
  "deleted",
];

export const orderSources: TOrderSourceName[] = [
  "Website",
  "Landing Page",
  "App",
  "Phone Call",
  "Social Media",
  "From Office",
  "Warranty Claimed",
];
