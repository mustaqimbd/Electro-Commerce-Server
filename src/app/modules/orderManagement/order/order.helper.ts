import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
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
  const data: TSanitizedOrProduct[] = [];
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
              manageStock: "$inventory.manageStock",
            },
            isDeleted: 1,
            variations: {
              $map: {
                input: "$variations",
                as: "variation",
                in: {
                  _id: "$$variation._id",
                  inventory: {
                    stockQuantity: "$$variation.inventory.stockQuantity",
                    manageStock: "$$variation.inventory.manageStock",
                  },
                  price: {
                    regularPrice: "$$variation.price.regularPrice",
                    salePrice: "$$variation.price.salePrice",
                  },
                },
              },
            },
          },
        },
      ])
    )[0];

    const findVariation = product?.variations?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (variation: any) => variation._id.toString() === item.variation.toString()
    )[0];

    if (product.variations) {
      if (!item.variation) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Please provide valid variation for product - ${product.title}`
        );
      }
      if (!findVariation) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Variation not match for product - ${product.title}`
        );
      }
    }

    const sanitizedData = {
      product: {
        ...product,
        price: findVariation?.price || product?.price,
        stock: findVariation?.inventory || product?.inventory,
        defaultInventory: product?.inventory?._id,
        variations: undefined,
        inventory: undefined,
      },
      quantity: item.quantity,
      variation: item?.variation
        ? new Types.ObjectId(String(item.variation))
        : undefined,
      isWarrantyClaim: !!item?.claimedCodes?.length,
      claimedCodes: item?.claimedCodes?.length ? item?.claimedCodes : undefined,
    };
    data.push(sanitizedData);
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
