import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationFields } from "../../../constants/pagination.const";
import catchAsync from "../../../utilities/catchAsync";
import pick from "../../../utilities/pick";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TUser } from "../user/user.interface";
import { TCustomer } from "./customer.interface";
import { CustomerServices } from "./customer.service";

const getAllCustomer = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields);
  const result = await CustomerServices.getAllCustomerFromDB(paginationOptions);
  successResponse<TUser[]>(res, {
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.data,
  });
});

const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerServices.updateCustomerIntoDB(
    req.user as TJwtPayload,
    req.body
  );
  successResponse<TCustomer>(res, {
    statusCode: httpStatus.OK,
    data: result,
  });
});

export const CustomerControllers = {
  getAllCustomer,
  updateCustomer,
};
