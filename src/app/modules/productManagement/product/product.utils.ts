import { Request } from "express";
import ProductModel from "./product.model";
import { CronJob } from "cron";
import PriceModel from "../price/price.model";
import { InventoryModel } from "../inventory/inventory.model";

const modifiedPriceData = (req: Request) => {
  const { price } = req.body;
  const save = price.regularPrice - price.salePrice || 0;
  price.priceSave = save === price.regularPrice ? 0 : save;
  const calculatedPrice: Record<string, unknown> = {};
  if (price && price.salePrice) {
    calculatedPrice.discountPercent = Number(
      (
        ((price.regularPrice - price.salePrice) / price.regularPrice) *
        100
      ).toFixed(2)
    );
    req.body.price = { ...price, ...calculatedPrice };
    return;
  }
  if (price && price.discountPercent) {
    calculatedPrice.salePrice = Number(
      (
        price.regularPrice -
        price.regularPrice * (price.discountPercent / 100)
      ).toFixed(2)
    );
    req.body.price = {
      ...price,
      ...calculatedPrice,
    };
  }
  if (!calculatedPrice.salePrice) {
    calculatedPrice.salePrice = price.regularPrice;
    req.body.price = {
      ...price,
      ...calculatedPrice,
    };
  }
};

// Cron job to run every day at midnight
export const deleteDraftProducts = new CronJob(
  "0 0 * * *", // Every day at midnight
  async () => {
    const currentDate = new Date();
    // Find products where status is 'Draft' and created more than 30 days ago
    const draftProducts = await ProductModel.find({
      "publishedStatus.status": "Draft",
      createdAt: {
        $lte: new Date(currentDate.setDate(currentDate.getDate() - 30)),
      },
    });

    if (draftProducts.length > 0) {
      const ids = draftProducts.map((product) => product._id);
      const priceIds = draftProducts.map((product) => product.price);
      const inventoryIds = draftProducts.map((product) => product.inventory);

      // Delete the products
      await ProductModel.deleteMany({ _id: { $in: ids } });
      await PriceModel.deleteMany({ _id: { $in: priceIds } });
      await InventoryModel.deleteMany({ _id: { $in: inventoryIds } });
    }
  },
  null, // No onComplete function needed
  true, // Start the job immediately
  "Asia/Dhaka" // Change this to your desired timezone
);

export default modifiedPriceData;
