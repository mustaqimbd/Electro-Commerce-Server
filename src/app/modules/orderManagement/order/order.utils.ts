import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { TProductDetails } from "./order.interface";

const createOrderId = () => {
  const date = new Date();
  const timestamp = date.getTime();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const randomLetters = "";
  const orderId = `${String(date.getFullYear()).slice(2)}${randomLetters}${date.getMonth() + 1}${date.getDate()}${randomNum}${String(timestamp).split("").reverse().join("")}`;
  return orderId.slice(0, 10);
};

const updateStockOnOrderCancelOrDelete = async (
  productDetails: TProductDetails[],
  session: mongoose.mongo.ClientSession,
  inc: boolean = true
) => {
  for (const item of productDetails) {
    const product = await ProductModel.findById(item.product, {
      inventory: 1,
    })
      .session(session)
      .lean();
    if (!product) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to find the product");
    }

    let updateQuey = item.quantity;

    if (!inc) {
      updateQuey = -item.quantity;
    }

    const updateQUantity = await InventoryModel.updateOne(
      { _id: product.inventory },
      { $inc: { stockQuantity: updateQuey } }
    ).session(session);
    if (!updateQUantity.modifiedCount) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to update quantity");
    }
  }
};

export { createOrderId, updateStockOnOrderCancelOrDelete };
