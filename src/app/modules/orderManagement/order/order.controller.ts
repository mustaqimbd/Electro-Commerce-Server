import { Request, Response } from "express";
import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../auth/auth.interface";
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

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersFromDB();

  successResponse<TOrder[]>(res, {
    statusCode: httpStatus.CREATED,
    message: "All orders retrieved successfully",
    data: result,
  });
});
const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { orderId } = req.params;

  await OrderServices.updateOrderStatusIntoDB(
    user as TJwtPayload,
    orderId as string,
    req.body
  );

  successResponse<TOrderStatusHistory>(res, {
    statusCode: httpStatus.CREATED,
    message: "Status updated successfully",
  });
});

const getOrderInfoByOrderId = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result = await OrderServices.getOrderInfoByOrderIdFromDB(orderId);

    successResponse<TOrder>(res, {
      statusCode: httpStatus.OK,
      message: "Order info retrieved successfully",
      data: result,
    });
  }
);

const seed = catchAsync(async (req: Request, res: Response) => {
  await OrderServices.orderSeed();
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Order deleted successfully",
  });
});

export const OrderController = {
  createOrder,
  getOrderInfoByOrderId,
  updateStatus,
  getAllOrders,
  seed,
};
