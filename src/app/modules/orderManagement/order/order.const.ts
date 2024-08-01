import { TOrderSourceName, TOrderStatus } from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "warranty processing",
  "follow up",
  "processing done",
  "warranty added",
  "On courier",
  "canceled",
  "returned",
  "partly completed",
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
