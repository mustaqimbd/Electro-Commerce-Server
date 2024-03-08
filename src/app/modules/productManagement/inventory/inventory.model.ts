import { Schema, model } from "mongoose";
import { TInventory } from "./inventory.interface";
import { stockStatus } from "./inventory.const";

const inventorySchema = new Schema<TInventory>(
  {
    sku: { type: String, unique: true, sparse: true },
    stockStatus: { type: String, enum: [...stockStatus], required: true },
    stockQuantity: { type: Number },
    stockAvailable: {
      type: Number,
      default: function (this: TInventory) {
        return this.stockQuantity;
      },
    },
    manageStock: { type: Boolean, default: false },
    lowStockWarning: { type: Number },
    productCode: { type: String },
    showStockQuantity: { type: Boolean, default: false },
    showStockWithText: { type: Boolean, default: false },
    hideStock: { type: Boolean, default: false },
    soldIndividually: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const InventoryModel = model<TInventory>("Inventory", inventorySchema);
