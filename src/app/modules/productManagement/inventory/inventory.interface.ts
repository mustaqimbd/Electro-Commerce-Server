import { Document, Types } from "mongoose";

export type TStockStatus = "In stock" | "Out of stock" | "On backorder";

export type TInventory = {
  product: Types.ObjectId;
  sku: string;
  stockStatus: TStockStatus;
  stockQuantity: number;
  stockAvailable?: number;
  lowStockWarning: number;
  manageStock: boolean;
  productCode?: string;
  showStockQuantity: boolean;
  showStockWithText: boolean;
  hideStock: boolean;
  soldIndividually: boolean;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
} & Document;
