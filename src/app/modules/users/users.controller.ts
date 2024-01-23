import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import successResponse from "../../../shared/successResponse";
import { IUser } from "./users.interface";
import { UsersService } from "./users.service";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const { customersInfo, ...userInfo } = req.body;
  const result = await UsersService.createCustomer(userInfo, customersInfo);
  successResponse<IUser>(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: result,
  });
});

const createAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, ...userInfo } = req.body;
  const result = await UsersService.createAdminOrStaff(userInfo, personalInfo);
  successResponse<IUser>(res, {
    statusCode: httpStatus.CREATED,
    message: `${userInfo.role} created successfully`,
    data: result,
  });
});

export const UserController = {
  createCustomer,
  createAdminOrStaff,
};
