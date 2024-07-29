import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TReportsQuery } from "./reports.interface";
import { ReportsServices } from "./reports.service";

const getOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportsServices.getOrdersFromDB(
    req.query as unknown as TReportsQuery
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Order info retrieved successfully.",
    data: result,
  });
});

export const ReportsController = {
  getOrders,
};
