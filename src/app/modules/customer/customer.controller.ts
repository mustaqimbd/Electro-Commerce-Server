import { Request, Response } from "express";
import httpStatus from "http-status";
import { paginationFields } from "../../constants/pagination.const";
import catchAsync from "../../utilities/catchAsync";
import pick from "../../utilities/pick";
import successResponse from "../../utilities/successResponse";
import { TUser } from "../user/user.interface";
import { CustomerServices } from "./customer.service";

const getAllCustomer = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = pick(req.query, paginationFields);
  const result = await CustomerServices.getAllCustomer(paginationOptions);
  successResponse<TUser[]>(res, {
    statusCode: httpStatus.OK,
    meta: result.meta,
    data: result.data,
  });
});

export const CustomerControllers = {
  getAllCustomer,
};
