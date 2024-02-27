/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import mongoose, { PipelineStage } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TSelectedAttributes } from "../../../types/attribute";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { Address } from "../../addressManagement/address/address.model";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { PaymentMethod } from "../../paymentMethod/paymentMethod.model";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.model";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { OrderedProducts } from "../orderedProducts/orderedProducts.model";
import { TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { TOrder, TOrderStatus } from "./order.interface";
import { Order } from "./order.model";
import createOrderId from "./order.utils";

const createOrderIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData,
  shippingChargeId: mongoose.Types.ObjectId,
  user: TOptionalAuthGuardPayload
): Promise<TOrder> => {
  const userQuery = optionalAuthUserQuery(user);
  let response;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orderData: Partial<TOrder> = {};
    let onlyProductsCosts = 0;
    const orderId = createOrderId();
    // calculation starts here costs
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
              select: "salePrice -_id",
            },
            {
              path: "inventory",
              select: "stockQuantity",
            },
          ],
        },
      })
      .session(session)
      .exec();
    if (!cart) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No item found on cart");
    }
    const quantityUpdateData: {
      productInventoryId: string;
      quantity: number;
    }[] = [];
    const orderedProductData = cart?.cartItems?.map(({ item }) => {
      const productItem = item as {
        quantity: number;
        attributes: TSelectedAttributes[];
        product: any;
      };
      if (productItem.product.isDeleted) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Selected product is no more available. ID: ${productItem.product._id}`
        );
      }
      if (
        productItem?.product.inventory?.stockQuantity < productItem.quantity
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Lack of stock. ID: ${productItem.product._id}`
        );
      }

      quantityUpdateData.push({
        productInventoryId: productItem.product.inventory._id,
        quantity: productItem.quantity,
      });
      const result = {
        product: productItem?.product?._id,
        unitPrice: productItem?.product?.price?.salePrice,
        quantity: productItem?.quantity,
        total: Math.round(
          productItem?.quantity * productItem?.product?.price?.salePrice
        ),
        attributes: productItem?.attributes,
      };
      onlyProductsCosts += result.total;
      return result;
    });
    // calculation ends here costs
    // decrease the quantity
    for (const item of quantityUpdateData) {
      await InventoryModel.updateOne(
        { _id: item.productInventoryId },
        { $inc: { stockQuantity: -item.quantity } }
      ).session(session);
    }
    // create ordered products document
    const orderedProductsData = {
      orderId,
      productDetails: orderedProductData,
    };
    orderData.orderedProductsDetails = (
      await OrderedProducts.create([orderedProductsData], { session })
    )[0]._id;
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
    const shippingCharges = await ShippingCharge.findById(shippingChargeId);
    if (!shippingCharges) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Failed to find shipping charges"
      );
    }
    orderData.orderId = orderId;
    orderData.userId = userQuery.userId as mongoose.Types.ObjectId;
    orderData.sessionId = userQuery.sessionId as string;
    orderData.subtotal = onlyProductsCosts;
    orderData.shippingCharge = shippingCharges?._id;
    orderData.total = onlyProductsCosts + Number(shippingCharges?.amount);
    orderData.status = "pending";
    const [orderRes] = await Order.create([orderData], { session });
    if (!orderRes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create order");
    }
    if (user.id) {
      await Address.updateOne({ uid: user.uid }, shipping).session(session);
    }
    // clear cart and cart items
    await Cart.deleteOne(userQuery).session(session);
    await CartItem.deleteMany(userQuery).session(session);
    response = orderRes;
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  return response;
};

const getAllOrdersAdminFromDB = async (query: Record<string, unknown>) => {
  const pipeline: PipelineStage[] = [
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
        _id: 1,
        orderId: 1,
        total: 1,
        status: 1,
        shipping: {
          customerName: "$shippingData.fullName",
          phoneNumber: "$shippingData.phoneNumber",
        },
      },
    },
  ];
  if (query.status) {
    pipeline.unshift({
      $match: { status: query?.status },
    });
  }

  const orderQuery = new AggregateQueryHelper(
    Order.aggregate(pipeline),
    query
  ).paginate();
  const data = await orderQuery.model;
  const total = (await ProductModel.aggregate(pipeline)).length;
  const meta = orderQuery.metaData(total);
  return { meta, data };
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

const getOrderInfoByOrderIdAdminFromDB = async (
  id: mongoose.Types.ObjectId
): Promise<TOrder | null> => {
  const result = await Order.findOne({ id }).populate([
    { path: "statusHistory" },
    { path: "shippingCharge" },
    {
      path: "orderedProductsDetails",
      select: "productDetails -_id",
      populate: {
        path: "productDetails.product",
        select: "title image id  -_id",
        populate: {
          path: "image",
          select: "thumbnail",
        },
      },
    },
  ]);
  return result;
};

const updateOrderStatusIntoDB = async (
  user: TJwtPayload,
  id: mongoose.Types.ObjectId,
  payload: {
    status: TOrderStatus;
    message: string;
  }
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const isOrderAvailable = await Order.findById(id).session(session);

    if (!isOrderAvailable) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order found");
    }
    if (isOrderAvailable?.status === "canceled") {
      throw new ApiError(httpStatus.BAD_REQUEST, "This order is canceled.");
    }
    isOrderAvailable.status = payload.status;
    await isOrderAvailable.save();

    const orderStatusHistory = await OrderStatusHistory.findOne({
      orderId: isOrderAvailable?.orderId,
    }).session(session);

    if (!orderStatusHistory) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order status found.");
    }

    orderStatusHistory.message =
      payload.status === "canceled" ? payload.message : undefined;

    orderStatusHistory.history.push({
      updatedBy: user.id,
      status: payload.status,
    });

    const result = await orderStatusHistory.save({ session });

    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to update status");
    }

    if (payload.status === "canceled") {
      const order = await Order.findOne(
        { orderId: isOrderAvailable?.orderId },
        { productDetails: 1 }
      )
        .populate([
          {
            path: "orderedProductsDetails",
            select: "productDetails.product productDetails.quantity -_id",
          },
        ])
        .session(session);

      const orderedProductsIds = (order?.orderedProductsDetails as any)
        ?.productDetails;
      for (const item of orderedProductsIds) {
        const product = await ProductModel.findById(item.product, {
          inventory: 1,
        })
          .session(session)
          .lean();
        if (!product) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Failed to find the product"
          );
        }
        const updateQUantity = await InventoryModel.updateOne(
          { _id: product.inventory },
          { $inc: { stockQuantity: item.quantity } }
        ).session(session);
        if (!updateQUantity.modifiedCount) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Failed to update quantity"
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

const orderSeed = async () => {
  await OrderedProducts.deleteMany();
  await OrderPayment.deleteMany();
  await Shipping.deleteMany();
  await OrderStatusHistory.deleteMany();
  await Order.deleteMany();
};

export const OrderServices = {
  createOrderIntoDB,
  updateOrderStatusIntoDB,
  getAllOrderCustomersFromDB,
  getOrderInfoByOrderIdCustomerFromDB,
  getOrderInfoByOrderIdAdminFromDB,
  getAllOrdersAdminFromDB,
  orderSeed,
};
