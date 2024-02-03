/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TSelectedAttributes } from "../../../types/attribute";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { Address } from "../../addressManagement/address/address.model";
import { TJwtPayload } from "../../auth/auth.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import ProductModel from "../../productManagement/product/product.mode";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { TOrderStatusHistoryData } from "../orderStatusHistory/orderStatusHistory.interface";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { OrderedProducts } from "../orderedProducts/orderedProducts.model";
import { TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { TOrder, TOrderData, TOrderStatus } from "./order.interface";
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
    let totalCost = 0;
    session.startTransaction();
    const orderId = createOrderId();

    // calculate starts here costs
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
      totalCost += result.total;
      return result;
    });
    // calculate ends here costs

    // decrease the quantity
    for (const item of quantityUpdateData) {
      const updateResult = await InventoryModel.updateOne(
        { _id: item.productInventoryId },
        { $inc: { stockQuantity: -item.quantity } }
      ).session(session);
      if (!updateResult.modifiedCount) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to update inventory quantity"
        );
      }
    }

    // create ordered products document
    const orderedProductsData = {
      orderId,
      productDetails: orderedProductData,
    };

    const [orderedProductsRes] = await OrderedProducts.create(
      [orderedProductsData],
      { session }
    );
    if (!orderedProductsRes) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Failed to create Ordered products"
      );
    }
    // create payment document
    payment.orderId = orderId;
    const [paymentRes] = await OrderPayment.create([payment], { session });
    if (!paymentRes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create payments");
    }

    shipping.orderId = orderId;
    // Create Shipping address
    const [shippingRes] = await Shipping.create([shipping], { session });
    if (!shippingRes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create shipping");
    }

    // create status document
    const status: TOrderStatusHistoryData = {
      orderId,
      status: "pending",
      history: [{}],
    };
    const [statusRes] = await OrderStatusHistory.create([status], { session });
    if (!statusRes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create status");
    }

    // get shipping charge
    const shippingCharges = await ShippingCharge.findById(shippingChargeId);
    if (!shippingCharges) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No shipping charges found");
    }

    // create order document
    const orderData: TOrderData = {
      orderId,
      userId: userQuery.userId as mongoose.Types.ObjectId,
      sessionId: userQuery.sessionId as string,
      orderedProductsDetails: orderedProductsRes._id,
      subtotal: totalCost,
      shippingCharge: shippingChargeId,
      total: totalCost + Number(shippingCharges?.amount),
      payment: paymentRes._id,
      status: statusRes._id,
      shipping: shippingRes._id,
    };
    const [orderRes] = await Order.create([orderData], { session });
    if (!orderRes) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create order");
    }

    if (user.id) {
      const updateShippingAddress = await Address.updateOne(
        { uid: user.uid },
        shipping
      ).session(session);
      if (!updateShippingAddress.acknowledged) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Failed to update address");
      }
    }

    // clear cart and cart items
    const deleteCart = await Cart.deleteOne(userQuery).session(session);
    if (!deleteCart.deletedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete the cart"
      );
    }
    const deleteCartItem =
      await CartItem.deleteMany(userQuery).session(session);
    if (!deleteCartItem.deletedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to delete the cart items"
      );
    }

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

const getAllOrdersFromDB = async (): Promise<TOrder[]> => {
  const result = await Order.find(
    {},
    { orderId: 1, total: 1, status: 1, createdAt: 1 }
  ).populate([
    {
      path: "status",
      select: "status -_id",
    },
    {
      path: "shipping",
      select: "fullName phoneNumber -_id",
    },
  ]);
  const result2 = result.filter(
    (item: any) => item.status.status !== "canceled"
  );
  return result2;
};

const getOrderInfoByOrderIdFromDB = async (
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
    }
  ).populate([
    { path: "status", select: "status -_id" },
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
  ]);
  if (!result) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this id");
  }
  return result;
};

const updateOrderStatusIntoDB = async (
  user: TJwtPayload,
  orderId: string,
  payload: {
    status: TOrderStatus;
    message: string;
  }
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const orderStatusHistory = await OrderStatusHistory.findOne({
      orderId,
    }).session(session);

    if (!orderStatusHistory) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No order status found.");
    }

    if (orderStatusHistory.status === "canceled") {
      throw new ApiError(httpStatus.BAD_REQUEST, "This order is canceled");
    }

    orderStatusHistory.status = payload.status;
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
      const order = await Order.findOne({ orderId }, { productDetails: 1 })
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
  getOrderInfoByOrderIdFromDB,
  getAllOrdersFromDB,
  orderSeed,
};
