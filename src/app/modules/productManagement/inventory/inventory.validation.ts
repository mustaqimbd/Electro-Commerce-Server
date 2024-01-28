import { z } from "zod";
import { stockStatus } from "./inventory.const";

export const inventoryValidationSchema = z.object({
  sku: z.string().min(1, { message: "SKU is required!" }).optional(),
  stockStatus: z.enum([...stockStatus] as [string, ...string[]]),
  stockQuantity: z.number(),
  lowStockWarning: z.number().optional(),
  manageStock: z.boolean().optional(),
  productCode: z.string().optional(),
  showStockQuantity: z.boolean().optional(),
  showStockWithText: z.boolean().optional(),
  hideStock: z.boolean().optional(),
  soldIndividually: z.boolean().optional(),
});

export const updateInventoryValidationSchema = z.object({
  body: z.object({
    sku: z.string().min(1, { message: "SKU is required!" }).optional(),
    stockStatus: z.enum([...stockStatus] as [string, ...string[]]),
    stockQuantity: z.number(),
    lowStockWarning: z.number().optional(),
    manageStock: z.boolean().optional(),
    productCode: z.string().optional(),
    showStockQuantity: z.boolean().optional(),
    showStockWithText: z.boolean().optional(),
    hideStock: z.boolean().optional(),
    soldIndividually: z.boolean().optional(),
  }),
});
