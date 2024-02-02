import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { OrderServices } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const { payment, shipping } = req.body;
  const result = await OrderServices.createOrderIntoDB(payment, shipping);

  successResponse(res, {
    statusCode: httpStatus.OK,
    data: result,
  });
});

export const OrderController = { createOrder };
