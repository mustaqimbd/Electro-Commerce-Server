import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import updateCourierStatus from "../../../helper/updateCourierStatus";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { convertIso } from "../../../utilities/ISOConverter";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { Courier } from "../../courier/courier.model";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TShipping } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { TOrder, TOrderStatus, TProductDetails } from "./order.interface";
import { Order } from "./order.model";
import {
  createNewOrder,
  createOrderOnSteedFast,
  deleteWarrantyFromOrder,
  ordersPipeline,
  updateStockOnOrderCancelOrDeleteOrRetrieve,
} from "./order.utils";

const maxOrderStatusChangeAtATime = 20;

const createOrderIntoDB = async (req: Request) => {
  let response;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    response = await createNewOrder(
      req as unknown as Record<string, unknown>,
      session,
      { warrantyClaim: false }
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
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
  if (query.search) {
    acceptableStatus.push("canceled");
  }
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

  // if there is no status or status is all and no search query provided
  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
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

  if (query.search) {
    pipeline.push({
      $match: {
        $expr: {
          $or: [
            { $eq: ["$shipping.phoneNumber", query.search] },
            { $eq: ["$orderId", query.search] },
          ],
        },
      },
    });
  }
  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;
  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = orderQuery.metaData(total);

  // get counts
  const statusMap = {
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    "follow up": 0,
    canceled: 0,
    deleted: 0,
  };
  const statusPipeline = [
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

  const result = await Order.aggregate(statusPipeline);

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

  return { countsByStatus: formattedResult, meta, data };
};

const getProcessingOrdersAdminFromDB = async (
  query: Record<string, string>
) => {
  const matchQuery: Record<string, unknown> = {};
  const acceptableStatus: TOrderStatus[] = [
    "processing",
    "warranty processing",
    "warranty added",
    "processing done",
  ];

  if (query.status) {
    matchQuery.status = query?.status as string;
  }

  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
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

  if (query.search) {
    pipeline.push({
      $match: {
        $expr: {
          $or: [
            { $eq: ["$shipping.phoneNumber", query.search] },
            { $eq: ["$orderId", query.search] },
          ],
        },
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;

  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = orderQuery.metaData(total);

  // Orders counts
  const statusMap = {
    processing: 0,
    "warranty processing": 0,
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

  if ((!query.status || query.status === "all") && !query.search) {
    matchQuery.status = {
      $in: acceptableStatus,
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

  if (query.search) {
    pipeline.push({
      $match: {
        $expr: {
          $or: [
            { $eq: ["$shipping.phoneNumber", query.search] },
            { $eq: ["$orderId", query.search] },
          ],
        },
      },
    });
  }

  const orderQuery = new AggregateQueryHelper(Order.aggregate(pipeline), query)
    .sort()
    .paginate();

  const data = await orderQuery.model;
  const total =
    (await Order.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
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
  user: TOptionalAuthGuardPayload,
  id: string
) => {
  const userQuery = optionalAuthUserQuery(user);
  if (userQuery.userId) {
    userQuery.userId = new Types.ObjectId(userQuery.userId);
  }

  const matchQuery = {
    ...userQuery,
    _id: new Types.ObjectId(id),
  };

  const pipeline = [
    { $match: matchQuery },
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
              src: "$paymentMethodImage.src",
              alt: "$paymentMethodImage.alt",
            },
          },
          phoneNumber: "$payment.phoneNumber",
          transactionId: "$payment.transactionId",
        },
        orderNotes: 1,
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
        orderNotes: 1,
        orderSource: 1,
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
        orderNotes: { $first: "$orderNotes" },
        orderSource: { $first: "$orderSource" },
        products: { $push: "$product" },
        createdAt: { $first: "$createdAt" },
      },
    },
  ];

  const result = (await Order.aggregate(pipeline))[0];

  return result;
};

const getAllOrderCustomersFromDB = async (user: TOptionalAuthGuardPayload) => {
  const userQuery = optionalAuthUserQuery(user);
  if (userQuery.userId) {
    userQuery.userId = new Types.ObjectId(userQuery.userId);
  }

  const matchQuery = {
    ...userQuery,
  };

  const pipeline = [
    { $match: matchQuery },
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
        payment: {
          phoneNumber: "$payment.phoneNumber",
          transactionId: "$payment.transactionId",
        },
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
      $project: {
        _id: 1,
        orderId: 1,
        subtotal: 1,
        total: 1,
        discount: 1,
        advance: 1,
        status: 1,
        shipping: 1,
        orderNotes: 1,
        payment: 1,
        product: {
          _id: "$productDetails._id",
          productId: "$productInfo._id",
          title: "$productInfo.title",
          image: {
            src: "$productThumb.src",
            alt: "$productThumb.alt",
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
        orderNotes: { $first: "$orderNotes" },
        products: { $push: "$product" },
        createdAt: { $first: "$createdAt" },
      },
    },
  ];

  const result = await Order.aggregate(pipeline);
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

    const statusUpdateQuery: {
      updateOne: {
        filter: {
          _id: Types.ObjectId;
        };
        update: {
          status: TOrderStatus;
          isDeleted: boolean;
        };
      };
    }[] = [];

    const historyUpdateQuery: {
      updateOne: {
        filter: {
          _id: Types.ObjectId;
        };
        update: {
          $push: {
            history: {
              status: TOrderStatus;
              updatedBy: Types.ObjectId;
            };
          };
        };
      };
    }[] = [];

    orders?.forEach((order) => {
      if (order.status !== payload.status) {
        const statusUpdateData = {
          updateOne: {
            filter: { _id: order._id },
            update: {
              status: payload.status,
              isDeleted: payload.status === "deleted",
            },
          },
        };
        statusUpdateQuery?.push(statusUpdateData);
        const historyUpdateData = {
          updateOne: {
            filter: { _id: order.statusHistory as Types.ObjectId },
            update: {
              $push: {
                history: {
                  status: payload.status,
                  updatedBy: user.id,
                },
              },
            },
          },
        };
        historyUpdateQuery.push(historyUpdateData);
      }
    });

    if (statusUpdateQuery.length) {
      await Order.bulkWrite(statusUpdateQuery, { session });
    }

    if (historyUpdateQuery.length) {
      await OrderStatusHistory.bulkWrite(historyUpdateQuery, { session });
    }
    // Change the orders one by one
    for (const order of orders) {
      // If this order's previous status is not same as the current
      if (order.status !== payload.status) {
        const orderPreviousStatus = order.status;

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
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
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
            product: "$productInfo._id",
            productTitle: "$productInfo.title",
            warranty: "$productDetails.warranty",
            productWarranty: "$productInfo.warranty",
            quantity: "$productDetails.quantity",
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
          deleteWarrantyFromOrder(order.productDetails, order._id, session),
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
  courierProvider: Types.ObjectId,
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

  let successCourierOrders: {
    orderId?: string;
    trackingId?: string;
    status?: string;
  }[] = [];
  let failedCourierOrders = [];

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orders = (await Order.aggregate([
      {
        $match: {
          _id: { $in: orderIds.map((item) => new Types.ObjectId(item)) },
          status: "processing done",
        },
      },
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
        $project: {
          status: 1,
          orderId: 1,
          total: 1,
          courierNotes: 1,
          productDetails: 1,
          shippingData: 1,
          shipping: 1,
          statusHistory: 1,
        },
      },
    ])) as Partial<TOrder[]>;

    const courier = await Courier.findById(courierProvider, {
      name: 1,
      credentials: 1,
      isActive: 1,
    });

    if (!courier)
      throw new ApiError(httpStatus.BAD_REQUEST, "No courier data found");
    if (!courier.isActive)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Courier '${courier.name}' is not active`
      );

    // courier booking request
    //Steed fast
    if (courier.name === "steedfast") {
      const { success: successRequests, error: failedRequests } =
        await createOrderOnSteedFast(orders, courier);
      successCourierOrders = successRequests;
      failedCourierOrders = failedRequests.map((item) => item.orderId);
    }
    let successOrders = orders;
    if (failedCourierOrders.length) {
      const courierOrdersOrderId = successCourierOrders.map(
        (item) => item.orderId
      );
      successOrders = orders.filter((item) =>
        courierOrdersOrderId.includes(item?.orderId)
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderUpdateQuery: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const historyUpdateQuery: any[] = [];
    successOrders.forEach((order) => {
      if (status === "On courier") {
        const trackingId = successCourierOrders.find(
          (item) => item.orderId === order?.orderId
        )?.trackingId;
        orderUpdateQuery.push({
          updateOne: {
            filter: { _id: order?._id },
            update: {
              status,
              courierDetails: { courierProvider, trackingId },
              deliveryStatus: "in_review",
            },
          },
        });
      }
      historyUpdateQuery.push({
        updateOne: {
          filter: { _id: order?.statusHistory },
          update: {
            $push: {
              history: {
                status,
                updatedBy: user.id,
              },
            },
          },
        },
      });
    });

    if (status === "canceled") {
      await Order.updateMany(
        { _id: orders.map((item) => new Types.ObjectId(item?._id)) },
        { $set: { status: "canceled" } },
        { session }
      );
      for (const order of orders) {
        await updateStockOnOrderCancelOrDeleteOrRetrieve(
          order?.productDetails || [],
          session
        );
        if (
          (order?.productDetails as TProductDetails[]).map(
            (item) => item.warranty
          ).length
        ) {
          await deleteWarrantyFromOrder(
            order?.productDetails || [],
            order?._id,
            session
          );
        }
      }
    } else if (status === "On courier") {
      await Order.bulkWrite(orderUpdateQuery, { session });
    }
    await OrderStatusHistory.bulkWrite(historyUpdateQuery, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }

  return {
    success: successCourierOrders?.length,
    error: failedCourierOrders?.length,
  };
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
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
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

const getCustomersOrdersCountByPhoneFromDB = async (phoneNumber: string) => {
  const orders = await Order.aggregate([
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
      $match: {
        "shippingData.phoneNumber": phoneNumber,
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);
  const statusMap = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    "warranty processing": 0,
    "follow up": 0,
    "processing done": 0,
    "warranty added": 0,
    "On courier": 0,
    canceled: 0,
    returned: 0,
    "partly returned": 0,
    completed: 0,
    deleted: 0,
  };
  orders.forEach(({ _id, total }) => {
    statusMap[_id as keyof typeof statusMap] = total;
  });
  const formattedCount = Object.entries(statusMap).map(([name, total]) => ({
    name,
    total,
  }));
  return formattedCount;
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
  getCustomersOrdersCountByPhoneFromDB,
};
