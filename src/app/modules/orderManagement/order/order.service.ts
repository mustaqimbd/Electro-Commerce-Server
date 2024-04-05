import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { PipelineStage } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { purchaseEventHelper } from "../../../helper/conversationAPI.helper";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TSelectedAttributes } from "../../../types/attribute";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import { convertIso } from "../../../utilities/ISOConverter";
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
import {
  TOrderedProducts,
  TProductDetails,
} from "../orderedProducts/orderedProducts.interface";
import { OrderedProducts } from "../orderedProducts/orderedProducts.model";
import { TShipping, TShippingData } from "../shipping/shipping.interface";
import { Shipping } from "../shipping/shipping.model";
import { TShippingCharge } from "../shippingCharge/shippingCharge.interface";
import { ShippingCharge } from "../shippingCharge/shippingCharge.model";
import { TOrder, TOrderSource, TOrderStatus } from "./order.interface";
import { Order } from "./order.model";
import createOrderId from "./order.utils";

const createOrderIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData,
  shippingChargeId: mongoose.Types.ObjectId,
  user: TOptionalAuthGuardPayload,
  orderFrom: string,
  orderNotes: string,
  req: Request,
  eventId: string,
  orderSource: TOrderSource
): Promise<TOrder> => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    singleOrder = orderedProductData[0];

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
    totalCost = onlyProductsCosts + Number(shippingCharges?.amount);
    orderData.orderId = orderId;
    orderData.userId = userQuery.userId as mongoose.Types.ObjectId;
    orderData.sessionId = userQuery.sessionId as string;
    orderData.subtotal = onlyProductsCosts;
    orderData.shippingCharge = shippingCharges?._id;
    orderData.total = totalCost;
    orderData.status = "pending";
    orderData.orderFrom = orderFrom;
    orderData.orderNotes = orderNotes;
    orderData.orderSource = { name: orderSource?.name, url: orderSource?.url };
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

  return response;
};

const createOrderFromSalesPageIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData,
  shippingChargeId: mongoose.Types.ObjectId,
  user: TOptionalAuthGuardPayload,
  orderFrom: string,
  productId: mongoose.Types.ObjectId,
  quantity: number,
  orderNotes: string,
  req: Request,
  eventId: string,
  orderSource: TOrderSource
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

  let totalCost = 0;
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
    totalCost = orderedProductData?.total + Number(shippingCharges?.amount);
    orderData.orderId = orderId;
    orderData.userId = userQuery.userId as mongoose.Types.ObjectId;
    orderData.sessionId = userQuery.sessionId as string;
    orderData.subtotal = orderedProductData?.total;
    orderData.shippingCharge = shippingCharges?._id;
    orderData.total = totalCost;

    orderData.status = "pending";
    orderData.orderFrom = orderFrom;
    orderData.orderNotes = orderNotes;
    orderData.orderSource = { name: orderSource?.name, url: orderSource?.url };
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

  // track on facebook pixel
  purchaseEventHelper(
    shipping,
    { productId, quantity, totalCost },
    orderSource,
    req,
    eventId
  );

  return response;
};

const getAllOrdersAdminFromDB = async (query: Record<string, string>) => {
  const matchQuery: Record<string, unknown> = {
    isDeleted: { $ne: true },
  };

  if (query.status) {
    matchQuery.status = query?.status as string;
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

  const pipeline: PipelineStage[] = [
    {
      $match: matchQuery,
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
    // {
    //   $lookup: {
    //     from: "paymentmethods",
    //     localField: "payment",
    //     foreignField: "_id",
    //     as: "paymentInfo",
    //   },
    // },
    // {
    //   $unwind: "$paymentInfo",
    // },
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
      $unwind: "$orderedProducts.productDetails",
    },
    {
      $lookup: {
        from: "products",
        localField: "orderedProducts.productDetails.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $unwind: "$productInfo",
    },
    {
      $group: {
        _id: "$_id",
        orderId: { $first: "$orderId" },
        total: { $first: "$total" },
        subtotal: { $first: "$subtotal" },
        discount: { $first: "$discount" },
        status: { $first: "$status" },
        shipping: { $first: "$shippingData" },
        shippingCharge: { $first: "$shippingCharge" },
        // payment: { $first: "$paymentInfo" },
        createdAt: { $first: "$createdAt" },
        officialNotes: { $first: "$officialNotes" },
        invoiceNotes: { $first: "$invoiceNotes" },
        courierNotes: { $first: "$courierNotes" },
        orderSource: { $first: "$orderFrom" },
        products: {
          $push: {
            title: "$productInfo.title",
            unitPrice: "$orderedProducts.productDetails.unitPrice",
            quantity: "$orderedProducts.productDetails.quantity",
            total: "$orderedProducts.productDetails.total",
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
        shipping: {
          fullName: "$shipping.fullName",
          phoneNumber: "$shipping.phoneNumber",
          fullAddress: "$shipping.fullAddress",
        },
        shippingCharge: { amount: "$shippingCharge.amount" },
        // payment: 1,
        products: 1,
        createdAt: 1,
        officialNotes: 1,
        invoiceNotes: 1,
        courierNotes: 1,
        orderSource: 1,
      },
    },
  ];

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
  //       as: "orderedproducts",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedproducts",
  //   },
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "orderedproducts.productDetails.product",
  //       foreignField: "_id",
  //       as: "products",
  //     },
  //   },
  //   {
  //     $unwind: "$products",
  //   },
  //   {
  //     $lookup: {
  //       from: "images",
  //       localField: "products.image.thumbnail",
  //       foreignField: "_id",
  //       as: "image",
  //     },
  //   },
  //   {
  //     $unwind: "$image",
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
  //       products: {
  //         _id: 1,
  //         title: 1,
  //         image: {
  //           src: "$image.src",
  //           alt: "$image.alt",
  //         },
  //         unitPrice: 1,
  //         quantity: 1,
  //         total: 1,
  //       },
  //       shipping: {
  //         fullName: 1,
  //         phoneNumber: 1,
  //         fullAddress: 1,
  //       },
  //       productDetails: {
  //         product: "$orderedProductsDetails.productDetails.product",
  //         unitPrice: "$orderedProductsDetails.productDetails.unitPrice",
  //       },
  //       orderedproducts: 1,
  //       status: 1,
  //       total: 1,
  //       courierNotes: 1,
  //       invoiceNotes: 1,
  //       officialNotes: 1,
  //       discount: 1,
  //     },
  //   },
  // ];

  // const result2 = await Order.aggregate(pipeline);
  // console.log(result2);
  // console.log(result2[0].orderedproducts);

  // const pipeline = [
  //   { $match: { _id: new mongoose.Types.ObjectId(id) } },
  //   {
  //     $lookup: {
  //       from: "orderedproducts",
  //       localField: "orderedProductsDetails",
  //       foreignField: "_id",
  //       as: "orderedProducts",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts",
  //   },
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "orderedProducts.productDetails.product",
  //       foreignField: "_id",
  //       as: "orderedProducts.productDetails.product",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts.productDetails.product",
  //   },
  //   {
  //     $lookup: {
  //       from: "images",
  //       localField: "orderedProducts.productDetails.product.image.thumbnail",
  //       foreignField: "_id",
  //       as: "orderedProducts.productDetails.product.image.thumbnail",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts.productDetails.product.image.thumbnail",
  //   },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       orderId: { $first: "$orderId" },
  //       userId: { $first: "$userId" },
  //       // Add other fields from Order model as needed
  //       orderedProducts: { $push: "$orderedProducts" },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0, // Exclude _id field
  //       orderId: 1,
  //       userId: 1,
  //       orderedProducts: {
  //         $map: {
  //           // orderItemID: "$$orderedProduct.productDetails._id",
  //           input: "$orderedProducts",
  //           as: "orderedProduct",
  //           in: {
  //             product: {
  //               _id: "$$orderedProduct.productDetails.product._id",
  //               title: "$$orderedProduct.productDetails.product.title",
  //               // Include other fields you need
  //               image: {
  //                 url: "$$orderedProduct.productDetails.product.image.thumbnail.src",
  //                 alt: "$$orderedProduct.productDetails.product.image.thumbnail.src",
  //               },
  //             },
  //           },
  //         },
  //       },
  //       // Project other fields from Order model as needed
  //     },
  //   },
  // ];

  // const pipeline = [
  //   { $match: { _id: new mongoose.Types.ObjectId(id) } },
  //   {
  //     $lookup: {
  //       from: "orderedproducts",
  //       localField: "orderedProductsDetails",
  //       foreignField: "_id",
  //       as: "orderedProducts",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts",
  //   },
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "orderedProducts.productDetails.product",
  //       foreignField: "_id",
  //       as: "orderedProducts.productDetails.product",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts.productDetails.product",
  //   },
  //   {
  //     $lookup: {
  //       from: "images",
  //       localField: "orderedProducts.productDetails.product.image.thumbnail",
  //       foreignField: "_id",
  //       as: "orderedProducts.productDetails.product.image.thumbnail",
  //     },
  //   },
  //   {
  //     $unwind: "$orderedProducts.productDetails.product.image.thumbnail",
  //   },
  //   {
  //     $group: {
  //       _id: "$_id",
  //       orderId: { $first: "$orderId" },
  //       userId: { $first: "$userId" },
  //       orderedProducts: {
  //         $push: {
  //           product: {
  //             _id: "$orderedProducts.productDetails.product._id",
  //             title: "$orderedProducts.productDetails.product.title",
  //             // Include other fields you need from the product
  //             image: {
  //               url: "$orderedProducts.productDetails.product.image.thumbnail.src",
  //               alt: "$orderedProducts.productDetails.product.image.thumbnail.src",
  //             },
  //           },
  //           productDetails: {
  //             $map: {
  //               input: "$orderedProducts.productDetails",
  //               as: "details",
  //               in: {
  //                 _id: "$$details._id",
  //                 unitPrice: "$$details.unitPrice",
  //                 quantity: "$$details.quantity",
  //                 total: "$$details.total",
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       orderId: 1,
  //       userId: 1,
  //       orderedProducts: 1,
  //     },
  //   },
  // ];

  // const res2 = await Order.aggregate(pipeline);
  // console.log(res2);

  // return res2;
  return result;
};

const updateOrderStatusIntoDB = async (
  user: TJwtPayload,
  payload: {
    status: TOrderStatus;
    message: string;
    orderIds: mongoose.Types.ObjectId[];
  }
): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    for (const id of payload.orderIds) {
      const isOrderAvailable = await Order.findById(id).session(session);

      if (!isOrderAvailable) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No order found");
      }
      if (isOrderAvailable?.status === "canceled") {
        throw new ApiError(httpStatus.BAD_REQUEST, "This order is canceled.");
      }
      if (isOrderAvailable?.status === "deleted") {
        throw new ApiError(httpStatus.BAD_REQUEST, "This order is deleted.");
      }
      isOrderAvailable.status = payload.status;
      if (payload.status === "deleted") {
        isOrderAvailable.isDeleted = true;
      }
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

      if (payload.status === "canceled" || payload.status === "deleted") {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { discount, shipping, invoiceNotes, officialNotes, courierNotes } =
    payload;
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
    await Order.findOneAndUpdate({ _id: id }, updatedDoc).session(session);

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
      const order = await Order.findOne({ _id: orderId }).populate([
        { path: "orderedProductsDetails", select: "productDetails" },
      ]);
      if (order) {
        order.orderedProductsDetails =
          order.orderedProductsDetails as TOrderedProducts;
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
  const stringToObject = new mongoose.Types.ObjectId(orderId);
  const findOrderAggregation = [
    {
      $match: { _id: stringToObject },
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
        _id: null,
        orderedProducts: 1,
        shippingCharge: 1,
        discount: 1,
      },
    },
  ];
  const order = (await Order.aggregate([...findOrderAggregation]))[0];

  const orderedProducts = order?.orderedProducts;
  const shippingCharge = order?.shippingCharge;

  if (!orderedProducts) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No order item found with this id."
    );
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let itemIndex = (
      orderedProducts?.productDetails as TProductDetails[]
    ).findIndex(
      (productDetail) => productDetail?._id.toString() === orderedItemId
    );

    if (itemIndex === -1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No order item found with this id."
      );
    }
    itemIndex = Number(itemIndex);

    const orderItem = orderedProducts.productDetails[itemIndex];
    const updateQuantityDoc = {
      $set: {
        "productDetails.$.quantity": quantity,
        "productDetails.$.total": orderItem.unitPrice * quantity,
      },
    };

    const productsQuantityUpdate = await OrderedProducts.updateOne(
      {
        "productDetails._id": orderItem._id,
      },
      updateQuantityDoc
    ).session(session);

    if (!productsQuantityUpdate.matchedCount) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to update order quantity"
      );
    }

    const productId = orderItem.product;
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
      productInventory.stockQuantity + orderItem.quantity - quantity;
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
    (orderedProducts.productDetails as TProductDetails[])
      .filter((item) => item._id !== orderItem._id)
      .forEach((item) => (subtotalWithoutChangedItem += item.total));

    const updatedSubtotal =
      subtotalWithoutChangedItem + orderItem.unitPrice * quantity;
    const updatedTotal =
      updatedSubtotal + shippingCharge.amount - Number(order?.discount || 0);

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
  const pipeline = [
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
    {
      $project: {
        name: "$_id",
        total: 1,
        _id: 0,
      },
    },
  ];
  const result = await Order.aggregate(pipeline);
  return result;
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
  createOrderFromSalesPageIntoDB,
  updateOrderStatusIntoDB,
  getAllOrderCustomersFromDB,
  getOrderInfoByOrderIdCustomerFromDB,
  getOrderInfoByOrderIdAdminFromDB,
  getAllOrdersAdminFromDB,
  updateOrderDetailsByAdminIntoDB,
  deleteOrdersByIdFromBD,
  updateOrderedProductQuantityByAdmin,
  orderCountsByStatusFromBD,
};
