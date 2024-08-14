import { Document, Types } from "mongoose";

export type TStockStatus = "In stock" | "Out of stock" | "On backorder";

export type TInventory = {
  product: Types.ObjectId;
  stockStatus: TStockStatus;
  stockQuantity: number;
  stockAvailable?: number;
  sku: string;
  productCode?: string;
  manageStock: boolean;
  lowStockWarning: number;
  // showStockQuantity: boolean;
  // showStockWithText: boolean;
  hideStock: boolean;
  // soldIndividually: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
} & Document;
