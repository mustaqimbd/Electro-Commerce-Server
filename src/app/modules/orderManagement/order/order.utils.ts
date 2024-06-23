import httpStatus from "http-status";
import mongoose, { ClientSession, PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { purchaseEventHelper } from "../../../helper/conversationAPI.helper";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import steedFastApi from "../../../utilities/steedfastApi";
import { Address } from "../../addressManagement/address/address.model";
import { TCourier } from "../../courier/courier.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { TPrice } from "../../productManagement/price/price.interface";
import { TProduct } from "../../productManagement/product/product.interface";
import ProductModel from "../../productManagement/product/product.model";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { TCartItem } from "../../shoppingCartManagement/cartItem/cartItem.interface";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { Warranty } from "../../warrantyManagement/warranty/warranty.model";
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
          then: {
            warrantyCodes: null,
            createdAt: null,
          },
          else: { $arrayElemAt: ["$warranty", 0] },
        },
      },
    },
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
      reasonNotes: 1,
      product: {
        _id: "$productDetails._id",
        productId: "$productInfo._id",
        title: "$productInfo.title",
        warranty: {
          _id: "$warranty._id",
          duration: "$warranty.duration",
          startDate: "$warranty.startDate",
          endsDate: "$warranty.endsDate",
          warrantyCodes: "$warranty.warrantyCodes",
        },
        unitPrice: "$productDetails.unitPrice",
        quantity: "$productDetails.quantity",
        total: "$productDetails.total",
        iSWarranty: "$productInfo.warranty",
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
      reasonNotes: { $first: "$reasonNotes" },
      followUpDate: { $first: "$followUpDate" },
      orderSource: { $first: "$orderSource" },
      products: { $push: "$product" },
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
    warrantyClaim: boolean;
    productsDetails: Partial<TProductDetails[]>;
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

  let { courierNotes, officialNotes, invoiceNotes, advance } = payload.body as {
    courierNotes?: string;
    officialNotes?: string;
    invoiceNotes?: string;
    advance?: number;
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

  if (custom || warrantyClaimOrderData?.warrantyClaim) {
    if (!user.id) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
    }
    if (!["admin", "staff"]?.includes(String(user?.role))) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Only staff or admin can create custom orders."
      );
    }
  }

  if (custom) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else if (salesPage) {
    orderedProductInfo = await OrderHelper.sanitizeOrderedProducts([
      orderedProducts[0],
    ]);
  } else if (
    warrantyClaimOrderData?.warrantyClaim &&
    warrantyClaimOrderData?.productsDetails
  ) {
    orderedProductInfo = await OrderHelper.sanitizeOrderedProducts(
      warrantyClaimOrderData?.productsDetails as TProductDetails[]
    );
  } else {
    const cart = await Cart.findOne(userQuery)
      .populate({
        path: "cartItems.item",
        select: "product attributes quantity -_id",
        populate: {
          path: "product",
          select: "price title isDeleted inventory",
          populate: [
            {
              path: "price",
              select: "salePrice regularPrice -_id",
            },
            {
              path: "inventory",
              select: "stockQuantity",
            },
          ],
        },
      })
      .exec();
    if (!cart) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No item found on cart");
    }
    orderedProductInfo = cart?.cartItems?.map(({ item }) => {
      const cartItem = item as TCartItem;
      const product = cartItem.product as TProduct;
      return {
        product: {
          _id: product._id,
          title: product.title,
          price: product.price as TPrice,
          inventory: product.inventory as TInventory,
          isDeleted: product.isDeleted,
        },
        quantity: cartItem.quantity,
        attributes: cartItem.attributes,
      };
    });
  }

  if (!custom) {
    courierNotes = undefined;
    officialNotes = undefined;
    invoiceNotes = undefined;
    advance = 0;
  }

  const quantityUpdateData: {
    productInventoryId: string;
    quantity: number;
  }[] = [];
  const orderedProductData = orderedProductInfo?.map((item) => {
    if (item.product.isDeleted) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product ${item.product.title} is no longer available`
      );
    }
    if (item?.product.inventory?.stockQuantity < item.quantity) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The product ${item.product.title} is out of stock, Please contact to the support team`
      );
    }

    quantityUpdateData.push({
      productInventoryId: item.product.inventory?._id,
      quantity: item.quantity,
    });
    const price = Number(
      item?.product?.price?.salePrice || item?.product?.price?.regularPrice
    );
    const result = {
      product: item?.product?._id,
      unitPrice: price,
      quantity: item?.quantity,
      total: Math.round(item?.quantity * price),
      // attributes: productItem?.attributes, //TODO: Enable if attributes is need
    };
    onlyProductsCosts += result.total;
    return result;
  });
  //  [costs] calculation ends here
  // decrease the quantity
  for (const item of quantityUpdateData) {
    await InventoryModel.updateOne(
      { _id: item.productInventoryId },
      { $inc: { stockQuantity: -item.quantity } }
    ).session(session);
  }

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
    warrantyAmount;
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
  const [orderRes] = await Order.create([orderData], { session });
  if (!orderRes) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create order");
  }
  if (user.id) {
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
