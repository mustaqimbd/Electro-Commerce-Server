import { Types } from "mongoose";

export type TInventory = {
  sku: string;
  manageStock: boolean;
  stockLevel: number;
  StockQuantity: number;
  stockStatus: "In stock" | "Out of stock" | "On backorder";
  lowStockWarning: number;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
};
