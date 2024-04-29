import { Request } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { purchaseEventHelper } from "../../../helper/conversationAPI.helper";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import updateCourierStatus from "../../../helper/updateCourierStatus";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { convertIso } from "../../../utilities/ISOConverter";
import { Address } from "../../addressManagement/address/address.model";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { TPrice } from "../../productManagement/price/price.interface";
import { TProduct } from "../../productManagement/product/product.interface";
import ProductModel from "../../productManagement/product/product.model";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { TCartItem } from "../../shoppingCartManagement/cartItem/cartItem.interface";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { OrderHelper } from "./order.helper";
import {
  TCourierProviders,
  TOrder,
  TOrderSource,
  TOrderStatus,
  TProductDetails,
  TSanitizedOrProduct,
} from "./order.interface";
import { Order } from "./order.model";
import {
  createOrderId,
  deleteWarrantyFromOrder,
  ordersPipeline,
  updateStockOnOrderCancelOrDeleteOrRetrieve,
} from "./order.utils";

const maxOrderStatusChangeAtATime = 20;

const createOrderIntoDB = async (
  body: unknown,
  req: Request
): Promise<TOrder> => {
  const {
    payment,
    shipping,
    shippingCharge,
    orderFrom,
    orderNotes,
    eventId,
    orderSource,
    custom,
    salesPage,
    orderedProducts,
  } = body as {
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

  let { courierNotes, officialNotes, invoiceNotes, advance } = body as {
    courierNotes?: string;
    officialNotes?: string;
    invoiceNotes?: string;
    advance?: number;
  };
  const user = req?.user as TOptionalAuthGuardPayload;
  const userQuery = optionalAuthUserQuery(user);
  let response;
  const session = await mongoose.startSession();
  let singleOrder: { product: string; quantity: number } = {
    product: "",
    quantity: 0,
  };
  let totalCost = 0;
  try {
    session.startTransaction();
    const orderData: Partial<TOrder> = {};
    let onlyProductsCosts = 0;
    const orderId = createOrderId();
    let orderedProductInfo: TSanitizedOrProduct[] = [];
    if (custom) {
      //TODO: Enable auth protection
      // if (!user.isAuthenticated) {
      //   throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized request");
      // }
      // if (!["admin", "staff"]?.includes(String(user?.role))) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "Only staff or admin can create custom orders."
      //   );
      // }
      orderedProductInfo =
        await OrderHelper.sanitizeOrderedProducts(orderedProducts);
    } else if (salesPage) {
      orderedProductInfo = await OrderHelper.sanitizeOrderedProducts([
        orderedProducts[0],
      ]);
    } else {
      const cart = await Cart.findOne(userQuery)
        .populate({
          path: "cartItems.item",
          select: "product attributes quantity -_id",
          populate: {
            path: "product",
            select: "price isDeleted inventory",
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
          `Selected product is no more available. ID: ${item.product._id}`
        );
      }
      if (item?.product.inventory?.stockQuantity < item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Lack of stock. ID: ${item.product._id}`
        );
      }

      quantityUpdateData.push({
        productInventoryId: item.product.inventory?._id,
        quantity: item.quantity,
      });

      const result = {
        product: item?.product?._id,
        unitPrice:
          item?.product?.price?.salePrice || item?.product?.price?.regularPrice,
        quantity: item?.quantity,
        total: Math.round(
          item?.quantity *
            Number(
              item?.product?.price?.salePrice ||
                item?.product?.price?.regularPrice
            )
        ),
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
    orderData.shipping = (
      await Shipping.create([shipping], { session })
    )[0]._id;
    // create status document
    orderData.statusHistory = (
      await OrderStatusHistory.create([{ orderId, history: [{}] }], {
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
    totalCost =
      onlyProductsCosts +
      Number(shippingCharges?.amount) -
      Number(advance || 0);
    orderData.orderId = orderId;
    orderData.userId = userQuery.userId as mongoose.Types.ObjectId;
    orderData.sessionId = userQuery.sessionId as string;
    orderData.subtotal = onlyProductsCosts;
    orderData.shippingCharge = shippingCharges?._id;
    orderData.total = totalCost;
    orderData.status = "pending";
    orderData.orderFrom = orderFrom;
    orderData.orderNotes = orderNotes;
    orderData.courierNotes = courierNotes;
    orderData.officialNotes = officialNotes;
    orderData.invoiceNotes = invoiceNotes;
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
    if (!salesPage || !custom) {
      await Cart.deleteOne(userQuery).session(session);
      await CartItem.deleteMany(userQuery).session(session);
    }
    response = orderRes;
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }

  if (!custom) {
    purchaseEventHelper(
      shipping,
      {
        productId: singleOrder.product,
        quantity: singleOrder.quantity,
        totalCost,
      },
      orderSource,
      req,
      eventId
    );
  }

  return response;
};

const getAllOrdersAdminFromDB = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "follow up",
  ];

  if (
    ![...acceptableStatus, "canceled", "deleted", "all", undefined].includes(
      query.status as never
    )
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  // if there is no status or status is all and no phone number provided
  if ((!query.status || query.status === "all") && !query.phoneNumber) {
    matchQuery.status = {
      $in: [...acceptableStatus],
    };
  }

  if (query.startFrom) {
    const startTime = convertIso(query.startFrom);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $gte: startTime,
    };
  }

  if (query.endAt) {
    const endTime = convertIso(query.endAt, false);
    matchQuery.createdAt = {
      ...(matchQuery.createdAt || {}),
      $lte: endTime,
    };
  }

  const pipeline = ordersPipeline();
  pipeline.unshift({
    $match: matchQuery,
  });

  if (query.phoneNumber) {
    pipeline.push({
      $match: {
        $expr: {
          $eq: ["$shipping.phoneNumber", query.phoneNumber],
        },
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).sort();
  // .paginate();
  const data = await orderQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
  const meta = orderQuery.metaData(total);

  return { meta, data };
};

const getProcessingOrdersAdminFromDB = async (
  query: Record<string, string>
) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "processing",
    "warranty added",
    "processing done",
  ];

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  if (query.orderId) {
    matchQuery.orderId = query.orderId;
  }

  if ((!query.status || query.status === "all") && !query.orderId) {
    matchQuery.status = {
      $in: [...acceptableStatus],
    };
  }

  if (![...acceptableStatus, undefined].includes(query.status as never)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  const pipeline = ordersPipeline();

  pipeline.unshift({
    $match: matchQuery,
  });

  const orderQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).sort();
  // .paginate();
  const data = await orderQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    processing: 0,
    "warranty added": 0,
    "processing done": 0,
  };
  const countRes = await Order.aggregate([
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  countRes.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return { countsByStatus: formattedCount, meta, data };
};

const getProcessingDoneCourierOrdersAdminFromDB = async (
  query: Record<string, string>
) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = ["processing done", "On courier"];

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  if (query.orderId) {
    matchQuery.orderId = query.orderId;
  }

  if ((!query.status || query.status === "all") && !query.orderId) {
    matchQuery.status = {
      $in: [...acceptableStatus],
    };
  }

  if (![...acceptableStatus, undefined].includes(query.status as never)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't get ${query.status} orders`
    );
  }

  const pipeline = ordersPipeline();

  pipeline.unshift({
    $match: matchQuery,
  });

  const orderQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).sort();
  // .paginate();
  const data = await orderQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    "processing done": 0,
    "On courier": 0,
  };
  const countRes = await Order.aggregate([
    {
      $match: {
        status: {
          $in: Object.keys(statusMap),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  countRes.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return { countsByStatus: formattedCount, meta, data };
};

const getOrderInfoByOrderIdAdminFromDB = async (
  id: mongoose.Types.ObjectId
): Promise<TOrder | null> => {
  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
              src: "$paymentMethodImage.src",
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
        from: "images",
        localField: "productInfo.image.thumbnail",
        foreignField: "_id",
        as: "productThumb",
      },
    },
    {
      $unwind: "$productThumb",
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
        advance: 1,
        status: 1,
        shipping: 1,
        shippingCharge: 1,
        officialNotes: 1,
        invoiceNotes: 1,
        courierNotes: 1,
        orderNotes: 1,
        orderSource: 1,
        statusHistory: 1,
        payment: 1,
        product: {
          _id: "$productDetails._id",
          productId: "$productInfo._id",
          title: "$productInfo.title",
          image: {
            src: "$productThumb.src",
            alt: "$productThumb.alt",
          },
          warranty: {
            warrantyCodes: "$warranty.warrantyCodes",
            createdAt: "$warranty.createdAt",
          },
          unitPrice: "$productDetails.unitPrice",
          quantity: "$productDetails.quantity",
          total: "$productDetails.total",
        },
        createdAt: 1,
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
        products: { $push: "$product" },
        createdAt: { $first: "$createdAt" },
      },
    },
  ];
  const result = (await Order.aggregate(pipeline))[0];

  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this id");
  }

  return result;
};

const getOrderInfoByOrderIdCustomerFromDB = async (
  orderId: string
): Promise<TOrder | null> => {
  const result = await Order.findOne(
    { orderId },
    {
      orderId: 1,
      subtotal: 1,
      shippingCharge: 1,
      total: 1,
      status: 1,
      orderedProductsDetails: 1,
      _id: 0,
      createdAt: 1,
      payment: 1,
      shipping: 1,
    }
  ).populate([
    { path: "shippingCharge", select: "amount name -_id" },
    {
      path: "orderedProductsDetails",
      select: "productDetails -_id",
      populate: {
        path: "productDetails.product",
        select: "title image -_id",
        populate: {
          path: "image",
          select: "thumbnail",
        },
      },
    },
    {
      path: "payment",
      populate: {
        path: "paymentMethod",
        select: "name image",
        populate: {
          path: "image",
          select: "src alt",
        },
      },
    },
    {
      path: "shipping",
    },
  ]);
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this id");
  }
  return result;
};

const getAllOrderCustomersFromDB = async (user: TOptionalAuthGuardPayload) => {
  const userQuery = optionalAuthUserQuery(user);
  const result = await Order.find(userQuery, {
    orderId: 1,
    orderedProductsDetails: 1,
    shippingCharge: 1,
    total: 1,
    payment: 1,
    status: 1,
    shipping: 1,
    _id: 0,
    updatedAt: 1,
  }).populate([
    {
      path: "orderedProductsDetails",
      select: "-orderId -_id -__v",
      populate: {
        path: "productDetails.product",
        select: "title image -_id",
      },
    },
    { path: "shippingCharge", select: "name amount -_id" },
  ]);
  return result;
};

const updateOrderStatusIntoDB = async (
  user: TJwtPayload,
  payload: {
    status: TOrderStatus;
    orderIds: mongoose.Types.ObjectId[];
  }
): Promise<void> => {
  // From this api admin can only change this orders
  const changableOrders: Partial<TOrderStatus[]> = [
    "pending",
    "confirmed",
    "follow up",
    "canceled",
  ];

  // From this API, admins can only change to this status below.
  const acceptableStatus: Partial<TOrderStatus[]> = [
    ...changableOrders,
    "processing",
    "canceled",
    "deleted",
  ];

  if (![...acceptableStatus].includes(payload.status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't change to ${payload.status}`
    );
  }

  if (payload?.orderIds?.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orders = await Order.find(
      {
        _id: { $in: payload.orderIds },
        status: { $in: changableOrders },
      },
      { orderId: 1, status: 1, statusHistory: 1, productDetails: 1 }
    ).session(session);

    // Change the orders one by one
    for (const order of orders) {
      // If this order's previous status is not same as the current
      if (order.status !== payload.status) {
        const orderPreviousStatus = order.status;

        const updatedDoc: Record<string, unknown> = {
          status: payload.status,
        };
        if (payload.status === "deleted") {
          updatedDoc.isDeleted = true;
        }

        await Order.updateOne({ _id: order._id }, updatedDoc, {
          upsert: true,
        }).session(session);

        await OrderStatusHistory.updateOne(
          { _id: order.statusHistory },
          {
            $push: {
              history: {
                status: payload.status,
                updatedBy: user.id,
              },
            },
          },
          { session }
        );

        const orderedProducts = order?.productDetails;

        // If the admin try to retrieve a canceled order
        if (
          orderPreviousStatus === "canceled" &&
          !["canceled", "deleted"].includes(payload.status)
        ) {
          await updateStockOnOrderCancelOrDeleteOrRetrieve(
            orderedProducts,
            session,
            false
          );
        }

        // if the previous status is not canceled or deleted and now try to cancel the order
        if (
          !["canceled", "deleted"].includes(orderPreviousStatus) &&
          ["canceled", "deleted"].includes(payload.status)
        ) {
          await updateStockOnOrderCancelOrDeleteOrRetrieve(
            orderedProducts,
            session
          );
        }
      }
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const updateProcessingStatusIntoDB = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  user: TJwtPayload
) => {
  const acceptableStatus = ["warranty added", "processing done", "canceled"];
  if (![...acceptableStatus].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
  }

  if (orderIds.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const pipeline = [
      {
        $match: {
          _id: {
            $in: orderIds.map((item) => new mongoose.Types.ObjectId(item)),
          },
          status: { $in: ["processing", "warranty added", "processing done"] },
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
          status: 1,
          statusHistory: 1,
          product: {
            _id: "$productDetails._id",
            productId: "$productInfo._id",
            productTitle: "$productInfo.title",
            warranty: "$productDetails.warranty",
            productWarranty: "$productInfo.warranty",
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          orderId: { $first: "$orderId" },
          status: { $first: "$status" },
          statusHistory: { $first: "$statusHistory" },
          productDetails: { $push: "$product" },
        },
      },
    ];
    const orders = await Order.aggregate(pipeline).session(session);

    for (const order of orders) {
      if (status === "processing done") {
        for (const {
          warranty,
          productWarranty,
          productTitle,
        } of order.productDetails) {
          if (productWarranty && !warranty) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              `Please add warranty to order '${order?.orderId}' product '${productTitle}'`
            );
          }
        }
      }

      // Update order status
      await Order.updateOne({ _id: order._id }, { status }, { session });

      // Update order status history
      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: {
            history: {
              status,
              updatedBy: user.id,
            },
          },
        },
        { session }
      );

      if (status === "canceled") {
        await Promise.all([
          updateStockOnOrderCancelOrDeleteOrRetrieve(
            order.productDetails,
            session
          ),
          deleteWarrantyFromOrder(order.productDetails, session),
        ]);
      }
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const bookCourierAndUpdateStatusIntoDB = async (
  orderIds: mongoose.Types.ObjectId[],
  status: Partial<TOrderStatus>,
  courierProvider: TCourierProviders,
  user: TJwtPayload
) => {
  if (!["On courier", "canceled"].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Can't change to ${status}`);
  }
  if (orderIds.length > maxOrderStatusChangeAtATime) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Can't update more than ${maxOrderStatusChangeAtATime} orders at a time`
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orders = await Order.find(
      { _id: { $in: orderIds }, status: "processing done" },
      { statusHistory: 1, status: 1, orderId: 1, productDetails: 1 }
    ).session(session);

    for (const order of orders) {
      const updatedDoc = {
        status,
        courierDetails: { courierProvider },
      };
      await Order.updateOne({ _id: order._id }, updatedDoc, {
        session,
        upsert: true,
      });

      await OrderStatusHistory.updateOne(
        { _id: order.statusHistory },
        {
          $push: {
            history: {
              status,
              updatedBy: user.id,
            },
          },
        },
        { session }
      );

      if (status === "canceled") {
        await updateStockOnOrderCancelOrDeleteOrRetrieve(
          order.productDetails,
          session
        );
        if (order.productDetails.map((item) => item.warranty).length) {
          await deleteWarrantyFromOrder(order.productDetails, session);
        }
      }
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const updateOrderDetailsByAdminIntoDB = async (
  id: mongoose.Types.ObjectId,
  payload: Partial<TOrder>
) => {
  const {
    discount,
    shipping,
    invoiceNotes,
    officialNotes,
    courierNotes,
    followUpDate,
  } = payload;
  const findOrder = await Order.findOne({ _id: id }).populate([
    { path: "shippingCharge", select: "amount -_id" },
  ]);
  if (!findOrder) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this ID.");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (Object.keys((shipping as TShipping) || {}).length) {
      await Shipping.findOneAndUpdate(
        { _id: findOrder.shipping },
        shipping
      ).session(session);
    }
    const updatedDoc: Record<string, unknown> = {};
    const discountInNumber = Number(discount || 0);

    if (discountInNumber || discountInNumber === 0) {
      updatedDoc.discount = discountInNumber;
      updatedDoc.total =
        Number(findOrder?.subtotal || 0) -
        discountInNumber +
        Number((findOrder?.shippingCharge as TShippingCharge)?.amount || 0);
    }

    updatedDoc.invoiceNotes = invoiceNotes;
    updatedDoc.officialNotes = officialNotes;
    updatedDoc.courierNotes = courierNotes;
    updatedDoc.followUpDate = followUpDate;

    await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          ...updatedDoc,
        },
      },
      { session, new: true }
    );

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const deleteOrdersByIdFromBD = async (orderIds: string[]) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    for (const orderId of orderIds) {
      const order = await Order.findOne({ _id: orderId });
      if (order) {
        // update quantity
        for (const item of order.productDetails) {
          const product = await ProductModel.findById(item.product, {
            inventory: 1,
            title: 1,
          }).lean();
          await InventoryModel.updateOne(
            { _id: product?.inventory },
            { $inc: { stockQuantity: item.quantity } }
          ).session(session);
        }
        order.isDeleted = true;
        order.status = "deleted";
        await order.save({ session });
      }
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const updateOrderedProductQuantityByAdmin = async (
  orderId: string,
  orderedItemId: string,
  quantity: number
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = (
      await Order.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(orderId) },
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
            productDetails: 1,
            shippingCharge: 1,
            discount: 1,
            advance: 1,
          },
        },
      ])
    )[0];

    if (!order) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found.");
    }

    const currentUpdateItem = (order.productDetails as TProductDetails[]).find(
      (item) => item._id.toString() === orderedItemId
    );

    const updateObj = {
      $set: {
        "productDetails.$.quantity": quantity,
        "productDetails.$.total":
          Number(currentUpdateItem?.unitPrice) * quantity,
      },
    };
    await Order.findOneAndUpdate(
      {
        _id: orderId,
        "productDetails._id": orderedItemId,
      },
      updateObj
    );

    const productId = currentUpdateItem?.product;
    const productInventory = (
      await ProductModel.aggregate([
        {
          $match: { _id: productId },
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
            _id: null,
            inventory: 1,
          },
        },
      ])
    )[0].inventory;

    const updatedQuantity =
      productInventory.stockQuantity + currentUpdateItem?.quantity - quantity;
    const result = await InventoryModel.updateOne(
      { _id: productInventory._id },
      { stockQuantity: updatedQuantity }
    ).session(session);

    if (!result.modifiedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update the stock quantity"
      );
    }

    let subtotalWithoutChangedItem = 0;
    (order.productDetails as TProductDetails[])
      .filter((item) => item._id !== currentUpdateItem?._id)
      .forEach((item) => (subtotalWithoutChangedItem += item.total));

    const updatedSubtotal =
      subtotalWithoutChangedItem +
      Number(currentUpdateItem?.unitPrice) * quantity;

    const updatedTotal =
      updatedSubtotal +
      order.shippingCharge.amount -
      Number(order?.discount || 0) -
      Number(order?.advance || 0);

    const orderUpdateRes = await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          subtotal: updatedSubtotal,
          total: updatedTotal,
        },
      }
    ).session(session);

    if (!orderUpdateRes.modifiedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update Order details."
      );
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const orderCountsByStatusFromBD = async () => {
  const statusMap = {
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    "follow up": 0,
    canceled: 0,
    deleted: 0,
  };
  const pipeline = [
    {
      $match: {
        status: {
          $in: Object.keys(statusMap).filter((status) => status !== "all"),
        },
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ];

  const result = await Order.aggregate(pipeline);

  result.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
    if (!["canceled", "deleted"].includes(_id)) {
      statusMap.all += total;
    }
  });

  const formattedResult = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));

  return formattedResult;
};

const updateOrdersDeliveryStatusIntoDB = async () => {
  await updateCourierStatus();
};

// this will need later
// const deleteOrderByIdFromBD = async (id: string) => {
//   const session = await mongoose.startSession();

//   const order = await Order.findOne({ _id: id }).populate([
//     { path: "orderedProductsDetails", select: "productDetails" },
//   ]);
//   if (!order) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this ID.");
//   }
//   order.orderedProductsDetails =
//     order.orderedProductsDetails as TOrderedProducts;

//   try {
//     session.startTransaction();
//     await OrderedProducts.findOneAndDelete({
//       _id: order?.orderedProductsDetails?._id,
//     }).session(session);

//     await OrderPayment.findOneAndDelete({ _id: order.payment }).session(
//       session
//     );

//     await Shipping.findOneAndDelete({ _id: order.shipping }).session(session);

//     await OrderStatusHistory.findOneAndDelete({
//       _id: order.statusHistory,
//     }).session(session);

//     await Order.findOneAndDelete({ _id: order._id }).session(session);

//     // update quantity
//     for (const item of order.orderedProductsDetails.productDetails) {
//       const product = await ProductModel.findById(item.product, {
//         inventory: 1,
//         title: 1,
//       }).lean();
//       await InventoryModel.updateOne(
//         { _id: product?.inventory },
//         { $inc: { stockQuantity: item.quantity } }
//       ).session(session);
//     }
//     await session.commitTransaction();
//     await session.endSession();
//   } catch (error) {
//     await session.abortTransaction();
//     await session.endSession();
//     throw error;
//   }
// };

export const OrderServices = {
  createOrderIntoDB,
  updateOrderStatusIntoDB,
  updateProcessingStatusIntoDB,
  bookCourierAndUpdateStatusIntoDB,
  getAllOrderCustomersFromDB,
  getOrderInfoByOrderIdCustomerFromDB,
  getOrderInfoByOrderIdAdminFromDB,
  getAllOrdersAdminFromDB,
  updateOrderDetailsByAdminIntoDB,
  deleteOrdersByIdFromBD,
  updateOrderedProductQuantityByAdmin,
  orderCountsByStatusFromBD,
  updateOrdersDeliveryStatusIntoDB,
  getProcessingOrdersAdminFromDB,
  getProcessingDoneCourierOrdersAdminFromDB,
};
