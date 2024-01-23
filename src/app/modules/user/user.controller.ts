import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TUser } from "./user.interface";
import { UserServices } from "./user.service";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const { customerInfo, ...userInfo } = req.body;
  const result = await UserServices.createCustomer(userInfo, customerInfo);
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: result,
  });
});

const createAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, ...userInfo } = req.body;
  const result = await UserServices.createAdminOrStaff(userInfo, personalInfo);
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: `${userInfo.role} created successfully`,
    data: result,
  });
});

export const UserControllers = {
  createCustomer,
  createAdminOrStaff,
};
