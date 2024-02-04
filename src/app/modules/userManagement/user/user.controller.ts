import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TUser } from "./user.interface";
import { UserServices } from "./user.service";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, address, ...userInfo } = req.body;
  const result = await UserServices.createCustomerIntoDB(
    personalInfo,
    address,
    userInfo
  );
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
    data: result,
  });
});

const createAdminOrStaff = catchAsync(async (req: Request, res: Response) => {
  const { personalInfo, address, ...userInfo } = req.body;
  const result = await UserServices.createAdminOrStaffIntoDB(
    personalInfo,
    address,
    userInfo
  );
  successResponse<TUser>(res, {
    statusCode: httpStatus.CREATED,
    message: `${userInfo.role} created successfully`,
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user as TJwtPayload;
  const result = await UserServices.geUserProfileFromDB(id);
  successResponse<TUser>(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

export const UserControllers = {
  createCustomer,
  createAdminOrStaff,
  getUserProfile,
};
