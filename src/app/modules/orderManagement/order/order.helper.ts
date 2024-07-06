import mongoose, { Types } from "mongoose";
import ProductModel from "../../productManagement/product/product.model";
import { TWarrantyClaimedProductDetails } from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import {
  TOrder,
  TProductDetails,
  TSanitizedOrProduct,
} from "./order.interface";
import { Order } from "./order.model";

type TsnOrderProduct = TProductDetails[] | TWarrantyClaimedProductDetails[];

const sanitizeOrderedProducts = async (
  orderedProducts: TsnOrderProduct
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
            title: 1,
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
      isWarrantyClaim: !!item?.claimedCodes?.length,
      claimedCodes: item?.claimedCodes?.length ? item?.claimedCodes : undefined,
    });
  }
  return data;
};

const findOrderForUpdatingOrder = async (
  id: Types.ObjectId
): Promise<TOrder> => {
  const order = (
    await Order.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
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
          as: "productDetails.productInfo",
        },
      },
      {
        $unwind: "$productDetails.productInfo",
      },
      {
        $lookup: {
          from: "inventories",
          localField: "productDetails.productInfo.inventory",
          foreignField: "_id",
          as: "productDetails.productInfo.inventoryInfo",
        },
      },
      {
        $unwind: "$productDetails.productInfo.inventoryInfo",
      },
      {
        $lookup: {
          from: "shippingcharges",
          localField: "shippingCharge",
          foreignField: "_id",
          as: "shippingChargeInfo",
        },
      },
      {
        $unwind: "$shippingChargeInfo",
      },
      {
        $group: {
          _id: "$_id",
          productDetails: {
            $push: {
              _id: "$productDetails._id",
              product: "$productDetails.product",
              attributes: "$productDetails.attributes",
              unitPrice: "$productDetails.unitPrice",
              quantity: "$productDetails.quantity",
              total: "$productDetails.total",
              warranty: "$productDetails.warranty",
              isWarrantyClaim: "$productDetails.isWarrantyClaim",
              claimedCodes: "$productDetails.claimedCodes",
              inventoryInfo: {
                _id: "$productDetails.productInfo.inventoryInfo._id",
                stockQuantity:
                  "$productDetails.productInfo.inventoryInfo.stockQuantity",
              },
            },
          },

          couponDetails: { $first: "$couponDetails" },
          subtotal: { $first: "$subtotal" },
          tax: { $first: "$tax" },
          shippingCharge: {
            $first: {
              _id: "$shippingChargeInfo._id",
              amount: "$shippingChargeInfo.amount",
            },
          },
          discount: { $first: "$discount" },
          shipping: { $first: "$shipping" },
          advance: { $first: "$advance" },
          warrantyAmount: { $first: "$warrantyAmount" },
          total: { $first: "$total" },
          status: { $first: "$status" },
        },
      },
    ])
  )[0] as TOrder;

  return order;
};

export const OrderHelper = {
  sanitizeOrderedProducts,
  findOrderForUpdatingOrder,
};
