import mongoose from "mongoose";
import ProductModel from "../../productManagement/product/product.model";
import { TProductDetails, TSanitizedOrProduct } from "./order.interface";

const sanitizeOrderedProducts = async (
  orderedProducts: TProductDetails[]
): Promise<TSanitizedOrProduct[]> => {
  const data = [];
  for (const item of orderedProducts) {
    const product = (
      await ProductModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(String(item.product)) } },
        {
          $lookup: {
            from: "prices",
            localField: "price",
            foreignField: "_id",
            as: "price",
          },
        },
        {
          $unwind: "$price",
        },
        {
          $lookup: {
            from: "inventories",
            localField: "inventory",
            foreignField: "_id",
            as: "inventory",
          },
        },
        {
          $unwind: "$inventory",
        },
        {
          $project: {
            price: {
              regularPrice: "$price.regularPrice",
              salePrice: "$price.salePrice",
            },
            inventory: {
              _id: "$inventory._id",
              stockQuantity: "$inventory.stockQuantity",
            },
            isDeleted: 1,
          },
        },
      ])
    )[0];
    data.push({
      product,
      quantity: item.quantity,
      attributes: item?.attributes,
    });
  }
  return data;
};

export const OrderHelper = { sanitizeOrderedProducts };
