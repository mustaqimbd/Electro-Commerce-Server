import { z } from "zod";
import { stockStatus } from "./inventory.const";

const inventory = z
  .object({
    stockStatus: z.enum([...stockStatus] as [string, ...string[]]),
    stockQuantity: z
      .number()
      .min(1, { message: "Stock quantity is required!" }),
    // sku: z.string().trim().optional(),
    // productCode: z.string().trim().optional(),
    manageStock: z.boolean().optional(),
    lowStockWarning: z.number().min(0).optional(),
    hideStock: z.boolean().optional(),
    // showStockQuantity: z.boolean().optional(),
    // showStockWithText: z.boolean().optional(),
    // soldIndividually: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.manageStock ||
      (data.manageStock && data.lowStockWarning !== undefined),
    {
      message: "Low stock warning is required!",
      path: ["lowStockWarning"],
    }
  );

export const InventoryValidation = {
  inventory,
};
