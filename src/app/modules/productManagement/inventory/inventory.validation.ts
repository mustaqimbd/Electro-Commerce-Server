import { z } from "zod";
import { stockStatus } from "./inventory.const";

const inventory = z.object({
  sku: z.string().min(1, { message: "SKU is required!" }).optional(),
  stockStatus: z.enum([...stockStatus] as [string, ...string[]]),
  stockQuantity: z.number().min(0).optional(),
  lowStockWarning: z.number().min(0).optional(),
  manageStock: z.boolean().optional(),
  productCode: z.string().optional(),
  showStockQuantity: z.boolean().optional(),
  showStockWithText: z.boolean().optional(),
  hideStock: z.boolean().optional(),
  soldIndividually: z.boolean().optional(),
});

const updateInventory = z.object({
  sku: z.string().min(1, { message: "SKU is required!" }).optional(),
  stockStatus: z.enum([...stockStatus] as [string, ...string[]]).optional(),
  stockQuantity: z.number().min(0).optional(),
  lowStockWarning: z.number().min(0).optional(),
  manageStock: z.boolean().optional(),
  productCode: z.string().optional(),
  showStockQuantity: z.boolean().optional(),
  showStockWithText: z.boolean().optional(),
  hideStock: z.boolean().optional(),
  soldIndividually: z.boolean().optional(),
});

export const InventoryValidation = {
  inventory,
  updateInventory,
};
