import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import successResponse from "../../shared/successResponse";
import { TUser } from "./user.interface";
import { UsersService } from "./user.service";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const { customersInfo, ...userInfo } = req.body;
  const result = await UsersService.createCustomer(userInfo, customersInfo);
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: result,
  });
});

const createAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, ...userInfo } = req.body;
  const result = await UsersService.createAdminOrStaff(userInfo, personalInfo);
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: `${userInfo.role} created successfully`,
    data: result,
  });
});

export const UserController = {
  createCustomer,
  createAdminOrStaff,
};
