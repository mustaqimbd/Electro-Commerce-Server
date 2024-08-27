import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
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

const orderDetailsPipeline: PipelineStage[] = [
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
    $lookup: {
      from: "orderpayments",
      localField: "payment",
      foreignField: "_id",
      as: "payment",
    },
  },
  {
    $unwind: "$payment",
  },
  {
    $lookup: {
      from: "paymentmethods",
      localField: "payment.paymentMethod",
      foreignField: "_id",
      as: "paymentMethod",
    },
  },
  {
    $unwind: "$paymentMethod",
  },
  {
    $lookup: {
      from: "images",
      localField: "paymentMethod.image",
      foreignField: "_id",
      as: "paymentMethodImage",
    },
  },
  {
    $unwind: "$paymentMethodImage",
  },
  {
    $lookup: {
      from: "orderstatushistories",
      localField: "statusHistory",
      foreignField: "_id",
      as: "statusHistory",
    },
  },
  {
    $unwind: "$statusHistory",
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      advance: 1,
      status: 1,
      shipping: {
        fullName: "$shippingData.fullName",
        phoneNumber: "$shippingData.phoneNumber",
        fullAddress: "$shippingData.fullAddress",
      },
      shippingCharge: {
        name: "$shippingCharge.name",
        amount: "$shippingCharge.amount",
      },
      payment: {
        paymentMethod: {
          name: "$paymentMethod.name",
          image: {
            src: {
              $concat: [config.image_server, "/", "$paymentMethodImage.src"],
            },
            alt: "$paymentMethodImage.alt",
          },
        },
        phoneNumber: "$payment.phoneNumber",
        transactionId: "$payment.transactionId",
      },
      statusHistory: {
        refunded: "$statusHistory.refunded",
        history: "$statusHistory.history",
      },
      officialNotes: 1,
      invoiceNotes: 1,
      courierNotes: 1,
      orderNotes: 1,
      followUpDate: 1,
      orderSource: 1,
      productDetails: 1,
      createdAt: 1,
    },
  },
  {
    $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
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
    $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "productInfo.image.thumbnail",
      foreignField: "_id",
      as: "productThumb",
    },
  },
  {
    $unwind: { path: "$productThumb", preserveNullAndEmptyArrays: true },
  },
  {
    $addFields: {
      variation: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$productInfo.variations",
              as: "variation",
              cond: {
                $eq: ["$$variation._id", "$productDetails.variation"],
              },
            },
          },
          0,
        ],
      },
    },
  },
  {
    $addFields: {
      product: {
        $cond: {
          if: { $not: ["$productDetails"] },
          then: null,
          else: {
            _id: "$productDetails._id",
            productId: "$productInfo._id",
            title: "$productInfo.title",
            image: {
              src: {
                $concat: [config.image_server, "/", "$productThumb.src"],
              },
              alt: "$productThumb.alt",
            },
            unitPrice: "$productDetails.unitPrice",
            isWarrantyClaim: "$productDetails.isWarrantyClaim",
            claimedCodes: "$productDetails.claimedCodes",
            quantity: "$productDetails.quantity",
            total: "$productDetails.total",
            variation: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$productInfo.variations" },
                    { $gt: [{ $size: "$productInfo.variations" }, 0] },
                  ],
                },
                then: {
                  _id: "$variation._id",
                  attributes: "$variation.attributes",
                  price: {
                    regularPrice: "$variation.price.regularPrice",
                    salePrice: "$variation.price.salePrice",
                    discountPercent: "$variation.price.discountPercent",
                  },
                  inventory: {
                    stockStatus: "$variation.inventory.stockStatus",
                    stockQuantity: "$variation.inventory.stockQuantity",
                    manageStock: "$variation.inventory.manageStock",
                    lowStockWarning: "$variation.inventory.lowStockWarning",
                  },
                },
                else: null,
              },
            },
          },
        },
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
      advance: { $first: "$advance" },
      status: { $first: "$status" },
      shipping: { $first: "$shipping" },
      payment: { $first: "$payment" },
      shippingCharge: { $first: "$shippingCharge" },
      officialNotes: { $first: "$officialNotes" },
      invoiceNotes: { $first: "$invoiceNotes" },
      courierNotes: { $first: "$courierNotes" },
      orderNotes: { $first: "$orderNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      statusHistory: { $first: "$statusHistory" },
      products: {
        $push: {
          $cond: {
            if: { $not: ["$product"] },
            then: "$$REMOVE",
            else: "$product",
          },
        },
      },
      createdAt: { $first: "$createdAt" },
    },
  },
  {
    $addFields: {
      products: {
        $cond: {
          if: { $eq: [{ $size: "$products" }, 0] },
          then: null,
          else: "$products",
        },
      },
    },
  },
];

const orderDetailsCustomerPipeline: PipelineStage[] = [
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
    $lookup: {
      from: "orderpayments",
      localField: "payment",
      foreignField: "_id",
      as: "payment",
    },
  },
  {
    $unwind: "$payment",
  },
  {
    $lookup: {
      from: "paymentmethods",
      localField: "payment.paymentMethod",
      foreignField: "_id",
      as: "paymentMethod",
    },
  },
  {
    $unwind: "$paymentMethod",
  },
  {
    $lookup: {
      from: "images",
      localField: "paymentMethod.image",
      foreignField: "_id",
      as: "paymentMethodImage",
    },
  },
  {
    $unwind: "$paymentMethodImage",
  },
  {
    $project: {
      _id: 1,
      orderId: 1,
      subtotal: 1,
      total: 1,
      discount: 1,
      advance: 1,
      status: 1,
      shipping: {
        fullName: "$shippingData.fullName",
        phoneNumber: "$shippingData.phoneNumber",
        fullAddress: "$shippingData.fullAddress",
      },
      shippingCharge: {
        name: "$shippingCharge.name",
        amount: "$shippingCharge.amount",
      },
      payment: {
        paymentMethod: {
          name: "$paymentMethod.name",
          image: {
            src: {
              $concat: [config.image_server, "/", "$paymentMethodImage.src"],
            },
            alt: "$paymentMethodImage.alt",
          },
        },
        phoneNumber: "$payment.phoneNumber",
        transactionId: "$payment.transactionId",
      },
      orderNotes: 1,
      followUpDate: 1,
      productDetails: 1,
      createdAt: 1,
    },
  },
  {
    $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
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
    $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true },
  },
  {
    $lookup: {
      from: "images",
      localField: "productInfo.image.thumbnail",
      foreignField: "_id",
      as: "productThumb",
    },
  },
  {
    $unwind: { path: "$productThumb", preserveNullAndEmptyArrays: true },
  },
  {
    $addFields: {
      variation: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$productInfo.variations",
              as: "variation",
              cond: {
                $eq: ["$$variation._id", "$productDetails.variation"],
              },
            },
          },
          0,
        ],
      },
    },
  },
  {
    $addFields: {
      product: {
        $cond: {
          if: { $not: ["$productDetails"] },
          then: null,
          else: {
            _id: "$productDetails._id",
            productId: "$productInfo._id",
            title: "$productInfo.title",
            image: {
              src: {
                $concat: [config.image_server, "/", "$productThumb.src"],
              },
              alt: "$productThumb.alt",
            },
            unitPrice: "$productDetails.unitPrice",
            isWarrantyClaim: "$productDetails.isWarrantyClaim",
            claimedCodes: "$productDetails.claimedCodes",
            quantity: "$productDetails.quantity",
            total: "$productDetails.total",
            variation: {
              $cond: {
                if: {
                  $and: [
                    { $isArray: "$productInfo.variations" },
                    { $gt: [{ $size: "$productInfo.variations" }, 0] },
                  ],
                },
                then: {
                  _id: "$variation._id",
                  attributes: "$variation.attributes",
                  price: {
                    regularPrice: "$variation.price.regularPrice",
                    salePrice: "$variation.price.salePrice",
                    discountPercent: "$variation.price.discountPercent",
                  },
                },
                else: null,
              },
            },
          },
        },
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
      advance: { $first: "$advance" },
      status: { $first: "$status" },
      shipping: { $first: "$shipping" },
      payment: { $first: "$payment" },
      shippingCharge: { $first: "$shippingCharge" },
      orderNotes: { $first: "$orderNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      products: {
        $push: {
          $cond: {
            if: { $not: ["$product"] },
            then: "$$REMOVE",
            else: "$product",
          },
        },
      },
      createdAt: { $first: "$createdAt" },
    },
  },
  {
    $addFields: {
      products: {
        $cond: {
          if: { $eq: [{ $size: "$products" }, 0] },
          then: null,
          else: "$products",
        },
      },
    },
  },
];

export const OrderHelper = {
  sanitizeOrderedProducts,
  findOrderForUpdatingOrder,
  orderDetailsPipeline,
  orderDetailsCustomerPipeline,
};
