import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TPermission } from "./permission.interface";
import { PermissionServices } from "./permission.service";

const createPermission = catchAsync(async (req: Request, res: Response) => {
  const result = await PermissionServices.createPermissionIntoDB(req.body);
  successResponse<TPermission>(res, {
    statusCode: httpStatus.CREATED,
    message: "Permission created successfully.",
    data: result,
  });
});

export const PermissionController = {
  createPermission,
};
