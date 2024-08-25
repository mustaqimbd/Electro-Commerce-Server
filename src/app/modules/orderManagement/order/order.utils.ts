import httpStatus from "http-status";
import mongoose, { ClientSession, PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { purchaseEventHelper } from "../../../helper/conversationAPI.helper";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import steedFastApi from "../../../utilities/steedfastApi";
import { Address } from "../../addressManagement/address/address.model";
import { TCourier } from "../../courier/courier.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
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
      advance: 1,
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
      reasonNotes: 1,
      orderNotes: 1,
      followUpDate: 1,
      productDetails: 1,
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
      from: "warranties",
      localField: "productDetails.warranty",
      foreignField: "_id",
      as: "warranty",
    },
  },
  {
    $addFields: {
      warranty: {
        $cond: {
          if: { $eq: [{ $size: "$warranty" }, 0] },
          then: null,
          else: { $arrayElemAt: ["$warranty", 0] },
        },
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
            isProductWarrantyAvailable: "$productInfo.title",
            warranty: "$warranty",
            unitPrice: "$productDetails.unitPrice",
            quantity: "$productDetails.quantity",
            total: "$productDetails.total",
          },
        },
      },
      // Removed warrantyProduct section
    },
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
      shipping: 1,
      shippingCharge: 1,
      createdAt: 1,
      officialNotes: 1,
      invoiceNotes: 1,
      courierNotes: 1,
      orderNotes: 1,
      followUpDate: 1,
      orderSource: 1,
      reasonNotes: 1,
      product: 1,
      // Removed warrantyProduct field
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
      shippingCharge: { $first: "$shippingCharge" },
      createdAt: { $first: "$createdAt" },
      officialNotes: { $first: "$officialNotes" },
      invoiceNotes: { $first: "$invoiceNotes" },
      courierNotes: { $first: "$courierNotes" },
      orderNotes: { $first: "$orderNotes" },
      reasonNotes: { $first: "$reasonNotes" },
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
      // Removed warrantyProducts field
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
      // Removed warrantyProducts field
    },
  },
];

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
                  stockQuantity: {
                    $arrayElemAt: [
                      "$variationDetails.variations.inventory.stockQuantity",
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
                  stockQuantity: "$defaultInventory.stockQuantity",
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

  const orderedProductData = await Promise.all(
    orderedProductInfo?.map(async (item) => {
      if (item.product.isDeleted) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `The product '${item.product.title}' is no longer available`
        );
      }
      if (item?.product?.stock?.manageStock) {
        if (item?.product?.stock?.stockQuantity < item?.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `The product '${item.product.title}' is out of stock, Please contact the support team`
          );
        }

        // Update stock
        if (item.variation) {
          if (item?.product?.stock?.manageStock) {
            await ProductModel.updateOne(
              {
                _id: item?.product?._id,
                "variations._id": item?.variation,
              },
              {
                $inc: {
                  "variations.$.inventory.stockQuantity": -item.quantity,
                },
              }
            ).session(session);
          }
        } else {
          if (item?.product?.stock?.manageStock) {
            await InventoryModel.updateOne(
              { _id: item?.product?.defaultInventory },
              { $inc: { stockQuantity: -item.quantity } }
            ).session(session);
          }
        }
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
      };

      onlyProductsCosts += result.total;

      return result;
    })
  );

  // throw new ApiError(404, "break");

  orderData.productDetails = orderedProductData as TProductDetails[];

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
  const shippingCharges = await ShippingCharge.findById(shippingCharge);
  if (!shippingCharges) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to find shipping charges"
    );
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
    await Cart.deleteOne(userQuery).session(session);
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
