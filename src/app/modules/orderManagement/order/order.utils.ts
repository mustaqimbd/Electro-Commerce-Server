import httpStatus from "http-status";
import mongoose, { ClientSession, PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { purchaseEventHelper } from "../../../helper/conversationAPI.helper";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import lowStockWarningEmail from "../../../utilities/lowStockWarningEmail";
import steedFastApi from "../../../utilities/steedfastApi";
import { CartItem } from "../../cartManagement/cartItem/cartItem.model";
import { TCourier } from "../../courier/courier.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { Address } from "../../userManagement/address/address.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
import { TWarrantyClaimedProductDetails } from "../../warrantyManagement/warrantyClaim/warrantyClaim.interface";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { OrderHelper } from "./order.helper";
import {
  TCourierResponse,
  TOrder,
  TOrderSource,
  TOrderStatus,
  TProductDetails,
  TSanitizedOrProduct,
} from "./order.interface";
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

export type TUpStOnCanDelProducts = {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  title: string;
  unitPrice: number;
  isWarrantyClaim: boolean;
  quantity: number;
  total: number;
  defaultInventory: {
    _id: Types.ObjectId;
    stockAvailable: number;
    manageStock: boolean;
    lowStockWarning: number;
  };
  variation: Types.ObjectId;
  variationDetails: {
    _id: Types.ObjectId;
    inventory: {
      stockAvailable: number;
      manageStock: boolean;
      lowStockWarning: number;
    };
  };
};

// This function can update the stock of canceled and deleted orders
export const updateStockOrderCancelDelete = async (
  productDetails: TUpStOnCanDelProducts[],
  session: mongoose.mongo.ClientSession,
  inc: boolean = true
) => {
  const variationMissingProducts = [];
  for (const item of productDetails) {
    let updateType = item.quantity;

    if (!inc) {
      updateType = -item.quantity;
    }
    if (item?.variation) {
      if (item?.variationDetails) {
        if (item?.variationDetails?.inventory?.manageStock) {
          await ProductModel.updateOne(
            {
              _id: item?.productId,
              "variations._id": item?.variation,
            },
            {
              $inc: {
                "variations.$.inventory.stockAvailable": updateType,
              },
            }
          ).session(session);
        }
      } else {
        variationMissingProducts.push(item.title);
      }
    } else {
      if (item?.defaultInventory?.manageStock) {
        await InventoryModel.updateOne(
          { _id: item.defaultInventory._id },
          { $inc: { stockAvailable: updateType } }
        ).session(session);
      }
    }
  }
};

// This function will delete warranty information from warranty collection and update order product details
export const deleteWarrantyFromOrder = async (
  productDetails: TProductDetails[],
  orderId: Types.ObjectId,
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
  await Order.updateOne(
    { _id: orderId, "productDetails.warranty": { $exists: true } },
    { $unset: { "productDetails.$.warranty": 1 } }
  ).session(session);
};

// create order
export const createNewOrder = async (
  payload: Record<string, unknown>,
  session: ClientSession,
  warrantyClaimOrderData?: {
    warrantyClaim?: boolean;
    productsDetails?:
      | Partial<TProductDetails[]>
      | TWarrantyClaimedProductDetails[];
  }
) => {
  const {
    payment,
    shipping,
    shippingCharge,
    orderNotes,
    eventId,
    orderedProducts,
    orderSource,
    custom,
    salesPage,
  } = payload.body as {
    payment: TPaymentData;
    shipping: TShippingData;
    shippingCharge: mongoose.Types.ObjectId;
    orderFrom: string;
    orderNotes: string;
    eventId: string;
    orderSource: TOrderSource;
    custom: boolean;
    salesPage: boolean;
    orderedProducts: TProductDetails[];
  };

  let { courierNotes, officialNotes, invoiceNotes, advance, discount } =
    payload.body as {
      courierNotes?: string;
      officialNotes?: string;
      invoiceNotes?: string;
      advance?: number;
      discount?: number;
    };

  const status: TOrderStatus = warrantyClaimOrderData?.warrantyClaim
    ? "warranty processing"
    : "pending";
  const user = payload?.user as TOptionalAuthGuardPayload;
  const userQuery = optionalAuthUserQuery(user);

  let singleOrder: { product: string; quantity: number } = {
    product: "",
    quantity: 0,
  };
  let totalCost = 0;

  const orderData: Partial<TOrder> = {};
  let onlyProductsCosts = 0;
  const orderId = createOrderId();
  let orderedProductInfo: TSanitizedOrProduct[] = [];

  // console.log(user);

  if (custom || warrantyClaimOrderData?.warrantyClaim) {
    if (!user.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
    }
    if (!["admin", "staff"]?.includes(String(user?.role))) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Permission denied");
    }
  }
  let fromWebsite = false;
  if (custom) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else if (salesPage) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else if (
    warrantyClaimOrderData?.warrantyClaim &&
    warrantyClaimOrderData?.productsDetails
  ) {
    orderedProductInfo = await OrderHelper.sanitizeOrderedProducts(
      warrantyClaimOrderData?.productsDetails as TProductDetails[]
    );
  } else {
    fromWebsite = true;
    const pipeline: PipelineStage[] = [
      {
        $match: userQuery,
      },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "inventories",
          localField: "productDetails.inventory",
          foreignField: "_id",
          as: "defaultInventory",
        },
      },
      {
        $unwind: "$defaultInventory",
      },
      {
        $lookup: {
          from: "prices",
          localField: "productDetails.price",
          foreignField: "_id",
          as: "productPrice",
        },
      },
      {
        $unwind: "$productPrice",
      },
      {
        $lookup: {
          from: "products",
          let: {
            productId: "$productDetails._id",
            variationId: "$variation", // Checking CartItem.variation, not the product
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$productId"] },
                    { $ne: ["$$variationId", null] }, // Ensure variation is present in CartItem
                  ],
                },
              },
            },
            {
              $project: {
                variations: {
                  $filter: {
                    input: "$variations",
                    as: "variation",
                    cond: { $eq: ["$$variation._id", "$$variationId"] }, // Match variationId
                  },
                },
              },
            },
          ],
          as: "variationDetails",
        },
      },
      {
        $unwind: {
          path: "$variationDetails",
          preserveNullAndEmptyArrays: true, // Handle cases without variation
        },
      },
      {
        $project: {
          product: {
            variationDetails: "$variationDetails",
            _id: "$productDetails._id",
            title: "$productDetails.title",
            isDeleted: "$productDetails.isDeleted",
            defaultInventory: "$defaultInventory._id",
            isVariationAvailable: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$variation", null] }, // Ensure variation is present
                    {
                      $gt: [
                        {
                          $size: {
                            $ifNull: ["$variationDetails.variations", []],
                          },
                        },
                        0,
                      ],
                    }, // Ensure variationDetails.variations is non-empty
                  ],
                },
                then: true,
                else: false,
              },
            },
            stock: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$variation", null] }, // Ensure variation is present
                    {
                      $gt: [
                        {
                          $size: {
                            $ifNull: ["$variationDetails.variations", []],
                          },
                        },
                        0,
                      ],
                    }, // Ensure variationDetails.variations is non-empty
                  ],
                },
                then: {
                  sku: {
                    $arrayElemAt: [
                      "$variationDetails.variations.inventory.sku",
                      0,
                    ],
                  },
                  lowStockWarning: {
                    $arrayElemAt: [
                      "$variationDetails.variations.inventory.lowStockWarning",
                      0,
                    ],
                  },
                  stockAvailable: {
                    $arrayElemAt: [
                      "$variationDetails.variations.inventory.stockAvailable",
                      0,
                    ],
                  },
                  manageStock: {
                    $arrayElemAt: [
                      "$variationDetails.variations.inventory.manageStock",
                      0,
                    ],
                  },
                },
                else: {
                  lowStockWarning: "$defaultInventory.lowStockWarning",
                  sku: "$defaultInventory.sku",
                  stockAvailable: "$defaultInventory.stockAvailable",
                  manageStock: "$defaultInventory.manageStock",
                },
              },
            },
            price: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$variation", null] }, // Ensure variation is present
                    {
                      $gt: [
                        {
                          $size: {
                            $ifNull: ["$variationDetails.variations", []],
                          },
                        },
                        0,
                      ],
                    }, // Ensure variationDetails.variations is non-empty
                  ],
                },
                then: {
                  regularPrice: {
                    $arrayElemAt: [
                      "$variationDetails.variations.price.regularPrice",
                      0,
                    ],
                  },
                  salePrice: {
                    $arrayElemAt: [
                      "$variationDetails.variations.price.salePrice",
                      0,
                    ],
                  },
                },
                else: {
                  regularPrice: "$productPrice.regularPrice",
                  salePrice: "$productPrice.salePrice",
                },
              },
            },
          },

          variation: 1,
          quantity: 1,
        },
      },
    ];

    const cart = await CartItem.aggregate(pipeline);
    if (!cart) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No item found on cart");
    }
    orderedProductInfo = cart;
  }

  if (config.env === "production") {
    if (salesPage || fromWebsite) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const orderCount = await Order.countDocuments({
        ...userQuery,
        createdAt: { $gte: oneHourAgo },
      });
      if (orderCount) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Reached order limit");
      }
    }
  }

  if (!custom) {
    courierNotes = undefined;
    officialNotes = undefined;
    invoiceNotes = undefined;
    advance = 0;
    discount = 0;
  }

  const orderedProductData = orderedProductInfo?.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attributes = (item.product as any)?.variationDetails?.variations
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item.product as any)?.variationDetails?.variations![0]?.attributes
      : undefined;

    if (item.variation && item.product.isVariationAvailable === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `On product ${item?.product?.title}, selected variation is no longer available.`
      );
    }

    if (item.product.isDeleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product '${item.product.title}' is no longer available`
      );
    }

    if (
      item?.product?.stock?.manageStock &&
      Number(item?.product?.stock?.stockAvailable || 0) < item?.quantity
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product '${item.product.title}' is out of stock, Please contact the support team`
      );
    }

    const price = Number(
      item?.product?.price?.salePrice || item?.product?.price?.regularPrice
    );

    const result = {
      product: item?.product?._id,
      unitPrice: price,
      quantity: item?.quantity,
      total: Math.round(item?.quantity * price),
      isWarrantyClaim: item?.isWarrantyClaim,
      claimedCodes: item?.claimedCodes,
      variation: item?.variation,
      attributes,
    };

    onlyProductsCosts += result.total;

    return {
      item,
      result,
    };
  });

  // Execute DB operations after mapping
  await Promise.all(
    orderedProductData.map(async ({ item }) => {
      if (item?.product?.stock?.manageStock) {
        const currentStock =
          Number(item?.product?.stock?.stockAvailable || 0) - item.quantity;
        if (currentStock < item?.product?.stock?.lowStockWarning) {
          await lowStockWarningEmail({
            productName: item?.product?.title,
            currentStock,
            sku: item?.product?.stock?.sku,
          });
        }
        if (item.variation) {
          await ProductModel.updateOne(
            {
              _id: item?.product?._id,
              "variations._id": item?.variation,
            },
            {
              $inc: {
                "variations.$.inventory.stockAvailable": -item.quantity,
              },
            }
          ).session(session);
        } else {
          await InventoryModel.updateOne(
            { _id: item?.product?.defaultInventory },
            { $inc: { stockAvailable: -item.quantity } }
          ).session(session);
        }
      }
    })
  );

  // Extract results after DB operations are done
  const finalOrderedProductData = orderedProductData.map(
    ({ result }) => result
  );

  orderData.productDetails = finalOrderedProductData as TProductDetails[];

  singleOrder = {
    product: String(orderedProductInfo[0]?.product?._id),
    quantity: orderedProductInfo[0].quantity,
  };
  // create payment document
  const paymentMethod = await PaymentMethod.findById(payment.paymentMethod);
  if (!paymentMethod) {
    {
      throw new ApiError(httpStatus.BAD_REQUEST, "No payment found");
    }
  }
  if (paymentMethod?.isPaymentDetailsNeeded) {
    if (!payment.phoneNumber || !payment.transactionId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request.");
    }
  }
  payment.orderId = orderId;
  orderData.payment = (
    await OrderPayment.create([payment], { session })
  )[0]._id;
  // Create Shipping data
  shipping.orderId = orderId;
  orderData.shipping = (await Shipping.create([shipping], { session }))[0]._id;
  // create status document
  orderData.statusHistory = (
    await OrderStatusHistory.create([{ orderId, history: [{ status }] }], {
      session,
    })
  )[0]._id;
  // get shipping charge
  const shippingCharges = await ShippingCharge.findOne({
    _id: shippingCharge,
    isActive: true,
  });
  if (!shippingCharges) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No shipping charges found");
  }

  let warrantyAmount = 0;
  warrantyAmount = onlyProductsCosts;
  if (!warrantyClaimOrderData?.warrantyClaim) {
    warrantyAmount = 0;
  }

  totalCost =
    onlyProductsCosts +
    Number(shippingCharges?.amount) -
    Number(advance || 0) -
    warrantyAmount -
    Number(discount || 0);

  orderData.orderId = orderId;
  orderData.userId = !warrantyClaimOrderData?.warrantyClaim
    ? (userQuery.userId as mongoose.Types.ObjectId)
    : undefined;
  orderData.sessionId = !warrantyClaimOrderData?.warrantyClaim
    ? (userQuery.sessionId as string)
    : undefined;
  orderData.subtotal = onlyProductsCosts;
  orderData.shippingCharge = shippingCharges?._id;
  orderData.total = totalCost;
  orderData.warrantyAmount = warrantyAmount;
  orderData.status = status;

  orderData.orderNotes = orderNotes;
  orderData.courierNotes = courierNotes;
  orderData.officialNotes = officialNotes;
  orderData.invoiceNotes = invoiceNotes;
  orderData.userIp = payload.clientIp as string;
  orderData.orderSource = {
    name: orderSource?.name,
    url: orderSource?.url,
    lpNo: orderSource?.lpNo,
  };
  orderData.advance = advance;
  orderData.discount = discount;
  const [orderRes] = await Order.create([orderData], { session });
  if (!orderRes) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create order");
  }
  if (user.id && user.role === "customer") {
    await Address.updateOne({ uid: user.uid }, shipping).session(session);
  }
  // clear cart and cart items
  if (!salesPage || !custom || !warrantyClaimOrderData?.warrantyClaim) {
    await CartItem.deleteMany(userQuery).session(session);
  }

  if (!custom && !warrantyClaimOrderData?.warrantyClaim) {
    purchaseEventHelper(
      shipping,
      {
        productId: singleOrder.product,
        quantity: singleOrder.quantity,
        totalCost,
      },
      orderSource,
      payload,
      eventId
    );
  }

  return orderRes;
};

type TOrderDataForCourier = {
  orderId: string;
  shippingData: TShipping;
  total: number;
  courierNotes: string;
};

// create order on 'steed fast' courier
export const createOrderOnSteedFast = async (
  orders: Partial<TOrder[]>,
  courier: TCourier
) => {
  const payload = (orders as unknown as TOrderDataForCourier[]).map(
    ({ orderId, shippingData, total, courierNotes }) => ({
      invoice: orderId,
      recipient_name: shippingData.fullName,
      recipient_address: shippingData.fullAddress,
      recipient_phone: shippingData.phoneNumber,
      cod_amount: total,
      note: courierNotes || "",
    })
  );

  const { data } = await steedFastApi({
    credentials: courier.credentials,
    endpoints: "/create_order/bulk-order",
    method: "POST",
    payload: payload as unknown as Record<string, string>[],
  });
  const sanitizedData = (data as TCourierResponse[]).map(
    ({ invoice, tracking_code, status }) => ({
      orderId: invoice,
      trackingId: tracking_code,
      status,
    })
  );

  return {
    success: sanitizedData.filter((item) => item.status === "success"),
    error: sanitizedData.filter((item) => item.status === "error"),
  };
};
