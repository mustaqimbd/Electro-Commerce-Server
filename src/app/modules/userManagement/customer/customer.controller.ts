import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { CustomerServices } from "./customer.service";

const getAllCustomer = catchAsync(async (req: Request, res: Response) => {
  const { meta, data } = await CustomerServices.getAllCustomerFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Customers retrieved successfully",
    meta: meta,
    data: data,
  });
});

const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerServices.updateCustomerIntoDB(
    req.user as TJwtPayload,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Updated successfully",
    data: result,
  });
});

export const CustomerControllers = {
  getAllCustomer,
  updateCustomer,
};
