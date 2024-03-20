import { Request, Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TOrderStatusHistory } from "../orderStatusHistory/orderStatusHistory.interface";
import { TOrder } from "./order.interface";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const { payment, shipping, shippingChargeId, orderFrom } = req.body;
  const user = req.user;
  const result = await OrderServices.createOrderIntoDB(
    payment,
    shipping,
    shippingChargeId,
    user as TOptionalAuthGuardPayload,
    orderFrom
  );

  successResponse<TOrder>(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully",
    data: result,
  });
});

const createOrderFromSalesPage = catchAsync(
  async (req: Request, res: Response) => {
    const {
      payment,
      shipping,
      shippingChargeId,
      orderFrom,
      productId,
      quantity,
    } = req.body;
    const user = req.user;
    const result = await OrderServices.createOrderFromSalesPageIntoDB(
      payment,
      shipping,
      shippingChargeId,
      user as TOptionalAuthGuardPayload,
      orderFrom,
      productId,
      quantity
    );
    successResponse<TOrder>(res, {
      statusCode: httpStatus.CREATED,
      message: "Order created successfully",
      data: result,
    });
  }
);

const getOrderInfoByOrderIdCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result =
      await OrderServices.getOrderInfoByOrderIdCustomerFromDB(orderId);

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Customers order info retrieved successfully",
      data: result,
    });
  }
);

const getOrderInfoByOrderIdAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await OrderServices.getOrderInfoByOrderIdAdminFromDB(
      id as unknown as mongoose.Types.ObjectId
    );

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Single order for admin retrieved successfully",
      data: result,
    });
  }
);

const getAllOrderCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrderCustomersFromDB(
    req.user as TOptionalAuthGuardPayload
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Customers orders info retrieved successfully",
    data: result,
  });
});

const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const { meta, data } = await OrderServices.getAllOrdersAdminFromDB(req.query);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All orders retrieved successfully",
    meta,
    data,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;

  await OrderServices.updateOrderStatusIntoDB(
    user as TJwtPayload,
    id as unknown as mongoose.Types.ObjectId,
    req.body
  );

  successResponse<TOrderStatusHistory>(res, {
    statusCode: httpStatus.CREATED,
    message: "Status updated successfully",
  });
});

const updateOrderDetails = catchAsync(async (req: Request, res: Response) => {
  await OrderServices.updateOrderDetailsByAdminIntoDB(
    req.params.id as unknown as mongoose.Types.ObjectId,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order details updated successfully.",
  });
});

const deleteOrderById = catchAsync(async (req: Request, res: Response) => {
  await OrderServices.deleteOrderByIdFromBD(req.params.id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order deleted successfully.",
  });
});

// const invoice = catchAsync(async (req: Request, res: Response) => {
//   const invoiceNumber = 'INV12345';
//   const date = new Date();
//   const products = [
//     { name: 'Product 1', quantity: 2, price: 10 },
//     { name: 'Product 2', quantity: 1, price: 20 },
//     { name: 'Product 3', quantity: 3, price: 15 }
//   ];
// const total = products.reduce((acc, product) => acc + (product.quantity * product.price), 0);
// res.render('invoice', { invoiceNumber, date, products, total });
// successResponse(res, {
//   statusCode: httpStatus.OK,
//   message: "Order deleted successfully.",
// });
// });

export const OrderController = {
  createOrder,
  getOrderInfoByOrderIdCustomer,
  getOrderInfoByOrderIdAdmin,
  getAllOrderCustomers,
  updateStatus,
  getAllOrdersAdmin,
  updateOrderDetails,
  createOrderFromSalesPage,
  deleteOrderById,
  // invoice
};
