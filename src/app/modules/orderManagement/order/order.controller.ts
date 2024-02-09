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
  const { payment, shipping, shippingChargeId } = req.body;
  const user = req.user;
  const result = await OrderServices.createOrderIntoDB(
    payment,
    shipping,
    shippingChargeId,
    user as TOptionalAuthGuardPayload
  );

  successResponse<TOrder>(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created successfully",
    data: result,
  });
});

const getOrderInfoByOrderIdCustomer = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result =
      await OrderServices.getOrderInfoByOrderIdCustomerFromDB(orderId);

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Order info retrieved successfully",
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
      message: "Order info retrieved successfully",
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
    message: "Order info retrieved successfully",
    data: result,
  });
});

const getAllOrdersAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersAdminFromDB(req.query);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "All orders retrieved successfully",
    data: result,
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

const seed = catchAsync(async (req: Request, res: Response) => {
  await OrderServices.orderSeed();
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Order deleted successfully",
  });
});

export const OrderController = {
  createOrder,
  getOrderInfoByOrderIdCustomer,
  getOrderInfoByOrderIdAdmin,
  getAllOrderCustomers,
  updateStatus,
  getAllOrdersAdmin,
  seed,
};