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
  const result = await OrderServices.createOrderIntoDB(
    req?.body,
    req as Request
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
  const { meta, data } = await OrderServices.getAllOrdersAdminFromDB(
    req.query as unknown as Record<string, string>
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All orders retrieved successfully",
    meta,
    data,
  });
});

const getProcessingOrdersAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getProcessingOrdersAdminFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Processing orders retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const getProcessingDoneCourierOrdersAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { countsByStatus, meta, data } =
      await OrderServices.getProcessingDoneCourierOrdersAdminFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Processing done and on courier orders retrieved successfully",
      meta,
      data: {
        countsByStatus,
        data,
      },
    });
  }
);

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  await OrderServices.updateOrderStatusIntoDB(user as TJwtPayload, req.body);

  successResponse<TOrderStatusHistory>(res, {
    statusCode: httpStatus.CREATED,
    message: "Status updated successfully",
  });
});

const updateProcessingStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    await OrderServices.updateProcessingStatusIntoDB(
      orderIds,
      status,
      req.user as TJwtPayload
    );

    successResponse<TOrderStatusHistory>(res, {
      statusCode: httpStatus.CREATED,
      message: "Status updated successfully",
    });
  }
);

const bookCourierAndUpdateStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { status, orderIds, courierProvider } = req.body;
    await OrderServices.bookCourierAndUpdateStatusIntoDB(
      orderIds,
      status,
      courierProvider,
      req.user as TJwtPayload
    );
    successResponse<TOrderStatusHistory>(res, {
      statusCode: httpStatus.CREATED,
      message: "Courier booked successfully",
    });
  }
);

const updateOrderDetailsByAdmin = catchAsync(
  async (req: Request, res: Response) => {
    await OrderServices.updateOrderDetailsByAdminIntoDB(
      req.params.id as unknown as mongoose.Types.ObjectId,
      req.body
    );

    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order details updated successfully.",
    });
  }
);

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

const orderCountsByStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.orderCountsByStatusFromBD();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Orders count by status",
    data: result,
  });
});

const updateOrdersDeliveryStatus = catchAsync(
  async (req: Request, res: Response) => {
    await OrderServices.updateOrdersDeliveryStatusIntoDB();
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Order delivery status updated successfully",
    });
  }
);

export const OrderController = {
  createOrder,
  getOrderInfoByOrderIdCustomer,
  getOrderInfoByOrderIdAdmin,
  getAllOrderCustomers,
  updateStatus,
  getAllOrdersAdmin,
  getProcessingOrdersAdmin,
  updateOrderDetailsByAdmin,
  deleteOrdersById,
  updateOrderedProductQuantityByAdmin,
  orderCountsByStatus,
  updateOrdersDeliveryStatus,
  updateProcessingStatus,
  bookCourierAndUpdateStatus,
  getProcessingDoneCourierOrdersAdmin,
};
