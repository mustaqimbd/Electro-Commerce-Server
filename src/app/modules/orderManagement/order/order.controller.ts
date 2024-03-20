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
  const { payment, shipping, shippingChargeId, orderFrom, orderNotes } =
    req.body;
  const user = req.user;
  const result = await OrderServices.createOrderIntoDB(
    payment,
    shipping,
    shippingChargeId,
    user as TOptionalAuthGuardPayload,
    orderFrom,
    orderNotes
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
      orderNotes,
    } = req.body;
    const user = req.user;
    const result = await OrderServices.createOrderFromSalesPageIntoDB(
      payment,
      shipping,
      shippingChargeId,
      user as TOptionalAuthGuardPayload,
      orderFrom,
      productId,
      quantity,
      orderNotes
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

const updateOrderedProductQuantityByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { orderedItemId, quantity } = req.body;
    await OrderServices.updateOrderedProductQuantityByAdmin(
      req.params.id,
      orderedItemId,
      Number(quantity)
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order quantity updated successfully.",
    });
  }
);

const deleteOrdersById = catchAsync(async (req: Request, res: Response) => {
  const { orderIds } = req.body;
  await OrderServices.deleteOrdersByIdFromBD(orderIds);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order deleted successfully.",
  });
});

export const OrderController = {
  createOrder,
  getOrderInfoByOrderIdCustomer,
  getOrderInfoByOrderIdAdmin,
  getAllOrderCustomers,
  updateStatus,
  getAllOrdersAdmin,
  updateOrderDetails,
  createOrderFromSalesPage,
  deleteOrdersById,
  updateOrderedProductQuantityByAdmin,
};
