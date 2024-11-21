import { z } from "zod";
import { stockStatus } from "./inventory.const";

const inventory = z
  .object({
    stockStatus: z.enum([...stockStatus] as [string, ...string[]]),
    stockQuantity: z.number().optional().default(0),
    stockAvailable: z.number().optional().default(0),
    preStockQuantity: z.number().optional().default(0),
    sku: z.string().trim().min(1, { message: "SKU is required!" }),
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
// .refine((data) => data.stockQuantity >= data.preStockQuantity, {
//   message: "Stock quantity cannot be lower than current value.",
//   path: ["stockQuantity"],
// });

export const InventoryValidation = {
  inventory,
};
