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
import { TInventory } from "../../productManagement/inventory/inventory.interface";
import { InventoryModel } from "../../productManagement/inventory/inventory.model";
import { TPrice } from "../../productManagement/price/price.interface";
import ProductModel from "../../productManagement/product/product.model";
import { Cart } from "../../shoppingCartManagement/cart/cart.model";
import { CartItem } from "../../shoppingCartManagement/cartItem/cartItem.model";
import { TPaymentData } from "../orderPayment/orderPayment.interface";
import { OrderPayment } from "../orderPayment/orderPayment.model";
import { OrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.model";
import { TOrderedProducts } from "../orderedProducts/orderedProducts.interface";
import { OrderedProducts } from "../orderedProducts/orderedProducts.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { TOrder, TOrderStatus } from "./order.interface";
import { Order } from "./order.model";
import createOrderId from "./order.utils";

const createOrderIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData,
  shippingChargeId: mongoose.Types.ObjectId,
  user: TOptionalAuthGuardPayload,
  orderFrom: string
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
              select: "salePrice regularPrice -_id",
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
        unitPrice:
          productItem?.product?.price?.salePrice ||
          productItem?.product?.price?.regularPrice,
        quantity: productItem?.quantity,
        total: Math.round(
          productItem?.quantity * productItem?.product?.price?.salePrice ||
            productItem?.product?.price?.regularPrice
        ),
        // attributes: productItem?.attributes,
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
    orderData.orderFrom = orderFrom;
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

const createOrderFromSalesPageIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData,
  shippingChargeId: mongoose.Types.ObjectId,
  user: TOptionalAuthGuardPayload,
  orderFrom: string,
  productId: mongoose.Types.ObjectId,
  quantity: number
): Promise<TOrder> => {
  if (typeof quantity !== "number" || !quantity) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Quantity must be numeric and greater than 1."
    );
  }
  if (typeof productId !== "string" || !productId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product ID must be given.");
  }

  const userQuery = optionalAuthUserQuery(user);
  let response;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const orderData: Partial<TOrder> = {};
    const orderId = createOrderId();

    const findOrderedProduct = await ProductModel.findOne(
      {
        _id: productId,
      },
      { inventory: 1, price: 1 }
    ).populate([{ path: "inventory" }, { path: "price" }]);
    if (
      (findOrderedProduct?.inventory as TInventory)?.stockQuantity < quantity
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Lack of stock quantity.");
    }
    if (!findOrderedProduct) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No products found.");
    }

    const orderedProductData = {
      product: findOrderedProduct?._id,
      unitPrice:
        (findOrderedProduct?.price as TPrice)?.salePrice ||
        (findOrderedProduct?.price as TPrice)?.regularPrice,
      quantity,
      total: Math.round(
        quantity *
          ((findOrderedProduct?.price as TPrice)?.salePrice ??
            (findOrderedProduct?.price as TPrice)?.regularPrice ??
            0)
      ),
    };

    // decrease the quantity
    const quantityUpdate = await InventoryModel.updateOne(
      { _id: findOrderedProduct?.inventory },
      { $inc: { stockQuantity: -quantity } }
    ).session(session);
    if (!quantityUpdate.modifiedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Something went wrong"
      );
    }
    // create ordered products document
    const orderedProductsData = {
      orderId,
      productDetails: [orderedProductData],
    };
    orderData.orderedProductsDetails = (
      await OrderedProducts.create([orderedProductsData], { session })
    )[0]._id;
    // create payment document
    const paymentMethod = await PaymentMethod.findById(payment.paymentMethod);
    if (!paymentMethod) {
      {
        throw new ApiError(httpStatus.BAD_REQUEST, "No payment method found");
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
    orderData.subtotal = orderedProductData?.total;
    orderData.shippingCharge = shippingCharges?._id;
    orderData.total =
      orderedProductData?.total + Number(shippingCharges?.amount);
    orderData.status = "pending";
    orderData.orderFrom = orderFrom;
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
      $lookup: {
        from: "orderpayments",
        localField: "payment",
        foreignField: "_id",
        as: "paymentInfo",
      },
    },
    {
      $unwind: "$paymentInfo",
    },
    {
      $lookup: {
        from: "orderedproducts",
        localField: "orderedProductsDetails",
        foreignField: "_id",
        as: "orderedProducts",
      },
    },
    {
      $unwind: "$orderedProducts",
    },
    {
      $lookup: {
        from: "paymentmethods",
        localField: "paymentInfo.paymentMethod",
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
        as: "paymentMethodThumb",
      },
    },
    {
      $unwind: "$paymentMethodThumb",
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
          fullAddress: "$shippingData.fullAddress",
        },
        createdAt: 1,
        payment: {
          method: {
            name: "$paymentMethod.name",
            image: {
              src: "$paymentMethodThumb.src",
              alt: "$paymentMethodThumb.alt",
            },
          },
          transactionId: "$paymentInfo.transactionId",
          phoneNumber: "$paymentInfo.phoneNumber",
        },
        orderedProducts: 1,
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
  ).sort();
  // .paginate();
  const data = await orderQuery.model;
  const total = (await Order.aggregate(pipeline)).length;
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
  const result = await Order.findOne({ _id: id }).populate([
    { path: "statusHistory", select: "refunded history -_id" },
    { path: "shippingCharge", select: "name amount -_id" },
    { path: "shipping", select: "fullName phoneNumber fullAddress -_id" },
    {
      path: "payment",
      select: "phoneNumber transactionId paymentMethod -_id",
      populate: {
        path: "paymentMethod",
        select: "name image -_id",
        populate: {
          path: "image",
          select: "src alt -_id",
        },
      },
    },
    {
      path: "orderedProductsDetails",
      select: "productDetails -_id",
      populate: {
        path: "productDetails.product",
        select: "title image id  _id",
        populate: {
          path: "image.thumbnail",
          select: "src alt -_id",
        },
      },
    },
  ]);

  if (!result) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No order was found with this ID."
    );
  }

  // const pipeline = [
  //   { $match: { _id: new mongoose.Types.ObjectId(id) } },
  //   {
  //     $lookup: {
  //       from: "orderedproducts",
  //       localField: "orderedProductsDetails",
  //       foreignField: "_id",
  //       as: "orderedproducts"
  //     }
  //   },
  //   {
  //     $unwind: "$orderedproducts"
  //   },
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "orderedproducts.productDetails.product",
  //       foreignField: "_id",
  //       as: "products"
  //     }
  //   },
  //   {
  //     $unwind: "$products"
  //   },
  //   {
  //     $lookup: {
  //       from: "images",
  //       localField: "products.image.thumbnail",
  //       foreignField: "_id",
  //       as: "image"
  //     }
  //   },
  //   {
  //     $unwind: "$image"
  //   },
  //   {
  //     $lookup: {
  //       from: "orderstatushistories",
  //       localField: "statusHistory",
  //       foreignField: "_id",
  //       as: "statusHistory"
  //     }
  //   },
  //   {
  //     $unwind: "$statusHistory"
  //   },
  //   {
  //     $lookup: {
  //       from: "shippings",
  //       localField: "shipping",
  //       foreignField: "_id",
  //       as: "shipping"
  //     }
  //   },
  //   {
  //     $unwind: "$shipping"
  //   },
  //   {
  //     $lookup: {
  //       from: "shippingcharges",
  //       localField: "shippingCharge",
  //       foreignField: "_id",
  //       as: "shippingCharge"
  //     }
  //   },
  //   {
  //     $unwind: "$shippingCharge"
  //   },
  //   {
  //     $lookup: {
  //       from: "orderpayments",
  //       localField: "payment",
  //       foreignField: "_id",
  //       as: "payment"
  //     }
  //   },
  //   {
  //     $unwind: "$payment"
  //   },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       shippingCharge: { $first: "$shippingCharge" },
  //       total: { $first: "$total" },
  //       payment: { $first: "$payment" },
  //       statusHistory: { $first: "$statusHistory" },
  //       status: { $first: "$status" },
  //       shipping: { $first: "$shipping" },
  //       products: {
  //         $push: {
  //           title: "$products.title",
  //           image: {
  //             src: "$image.src",
  //             alt: "$image.alt"
  //           },
  //           unitPrice: "$orderedproducts.productDetails.unitPrice"
  //         }
  //       } // Group products into an array
  //     }
  //   },
  //   {
  //     $project: {
  //       _id: 1,
  //       statusHistory: { refunded: 1, history: 1 },
  //       shippingCharge: { name: 1, amount: 1 },
  //       payment: 1,
  //       products: 1,
  //       shipping: {
  //         fullName: 1,
  //         phoneNumber: 1,
  //         fullAddress: 1,
  //       },
  //       status: 1,
  //       total: 1,
  //     }
  //   }
  // ];

  // const result = await Order.aggregate(pipeline)

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
    await isOrderAvailable.save({ session });

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

const updateOrderDetailsByAdminIntoDB = async (
  id: mongoose.Types.ObjectId,
  payload: Partial<TOrder>
) => {
  const { subtotal, shipping } = payload;
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
    if (subtotal) {
      const subtotalInNumber = Number(subtotal || 0);
      const updatedDoc = {
        subtotal: subtotalInNumber,
        total:
          subtotalInNumber +
          (findOrder.shippingCharge as TShippingCharge).amount,
      };
      await Order.findOneAndUpdate({ _id: id }, updatedDoc).session(session);
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const deleteOrderByIdFromBD = async (id: string) => {
  const session = await mongoose.startSession();

  const order = await Order.findOne({ _id: id }).populate([
    { path: "orderedProductsDetails", select: "productDetails" },
  ]);
  if (!order) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No order found with this ID.");
  }
  order.orderedProductsDetails =
    order.orderedProductsDetails as TOrderedProducts;

  try {
    session.startTransaction();
    await OrderedProducts.findOneAndDelete({
      _id: order?.orderedProductsDetails?._id,
    }).session(session);

    await OrderPayment.findOneAndDelete({ _id: order.payment }).session(
      session
    );

    await Shipping.findOneAndDelete({ _id: order.shipping }).session(session);

    await OrderStatusHistory.findOneAndDelete({
      _id: order.statusHistory,
    }).session(session);

    await Order.findOneAndDelete({ _id: order._id }).session(session);

    // update quantity
    for (const item of order.orderedProductsDetails.productDetails) {
      const product = await ProductModel.findById(item.product, {
        inventory: 1,
        title: 1,
      }).lean();
      await InventoryModel.updateOne(
        { _id: product?.inventory },
        { $inc: { stockQuantity: item.quantity } }
      ).session(session);
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const OrderServices = {
  createOrderIntoDB,
  createOrderFromSalesPageIntoDB,
  updateOrderStatusIntoDB,
  getAllOrderCustomersFromDB,
  getOrderInfoByOrderIdCustomerFromDB,
  getOrderInfoByOrderIdAdminFromDB,
  getAllOrdersAdminFromDB,
  updateOrderDetailsByAdminIntoDB,
  deleteOrderByIdFromBD,
};
