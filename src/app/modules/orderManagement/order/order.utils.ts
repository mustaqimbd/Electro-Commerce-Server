import httpStatus from "http-status";
import mongoose, { PipelineStage } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { TProductDetails } from "./order.interface";
import { Order } from "./order.model";

export const createOrderId = () => {
  const date = new Date();
  const timestamp = date.getTime();
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const randomLetters = "";
  const orderId = `${String(date.getFullYear()).slice(2)}${randomLetters}${date.getMonth() + 1}${date.getDate()}${randomNum}${String(timestamp).split("").reverse().join("")}`;
  return orderId.slice(0, 10);
};

// This function will increase or decrease stock quantity base on command. The first parameter will receive product details, the second parameter will receive mongoDB session and the third parameter will receive a boolean value. Base on the value the stock will increase od decrease
export const updateStockOnOrderCancelOrDeleteOrRetrieve = async (
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

// This pipeline will retrieve orders information
export const ordersPipeline = (): PipelineStage[] => [
  {
    $lookup: {
      from: "shippings",
      localField: "shipping",
      foreignField: "_id",
      as: "shippingData",
    },
  },
  {
    $unwind: "$shippingData",
  },
  {
    $lookup: {
      from: "shippingcharges",
      localField: "shippingCharge",
      foreignField: "_id",
      as: "shippingCharge",
    },
  },
  {
    $unwind: "$shippingCharge",
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      status: 1,
      shipping: {
        fullName: "$shippingData.fullName",
        phoneNumber: "$shippingData.phoneNumber",
        fullAddress: "$shippingData.fullAddress",
      },
      shippingCharge: { amount: "$shippingCharge.amount" },
      createdAt: 1,
      officialNotes: 1,
      invoiceNotes: 1,
      courierNotes: 1,
      orderSource: 1,
      followUpDate: 1,
      productDetails: 1,
    },
  },
  {
    $unwind: "$productDetails",
  },
  {
    $lookup: {
      from: "products",
      localField: "productDetails.product",
      foreignField: "_id",
      as: "productInfo",
    },
  },
  {
    $unwind: "$productInfo",
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      status: 1,
      shipping: 1,
      shippingCharge: 1,
      createdAt: 1,
      officialNotes: 1,
      invoiceNotes: 1,
      courierNotes: 1,
      followUpDate: 1,
      orderSource: 1,
      product: {
        title: "$productInfo.title",
        unitPrice: "$productDetails.unitPrice",
        quantity: "$productDetails.quantity",
        total: "$productDetails.total",
      },
    },
  },
  {
    $group: {
      _id: "$_id",
      orderId: { $first: "$orderId" },
      total: { $first: "$total" },
      subtotal: { $first: "$subtotal" },
      discount: { $first: "$discount" },
      status: { $first: "$status" },
      shipping: { $first: "$shipping" },
      shippingCharge: { $first: "$shippingCharge" },
      createdAt: { $first: "$createdAt" },
      officialNotes: { $first: "$officialNotes" },
      invoiceNotes: { $first: "$invoiceNotes" },
      courierNotes: { $first: "$courierNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      products: { $push: "$product" },
    },
  },
];

// This function will delete warranty information from warranty collection and update order product details
export const deleteWarrantyFromOrder = async (
  productDetails: TProductDetails[],
  session: mongoose.mongo.ClientSession
) => {
  const deleteQuery = {
    _id: {
      $in: productDetails
        .map((item) => item.warranty)
        .map(
          (item) => new mongoose.Types.ObjectId(item as mongoose.Types.ObjectId)
        ),
    },
  };
  await Warranty.deleteMany(deleteQuery).session(session);
  await Order.updateMany(
    { "productDetails.warranty": { $exists: true } },
    { $unset: { "productDetails.$[].warranty": 1 } }
  ).session(session);
};
