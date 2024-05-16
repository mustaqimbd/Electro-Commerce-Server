import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TWarrantyInfoInput } from "./warranty.interface";
import { WarrantyService } from "./warranty.service";

const createWarranty = catchAsync(async (req: Request, res: Response) => {
  const { order_Id, warrantyInfo } = req.body;
  await WarrantyService.createWarrantyIntoDB(
    order_Id,
    warrantyInfo as TWarrantyInfoInput[],
    req.user as TJwtPayload
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Warranty created successfully",
  });
});
const updateWarranty = catchAsync(async (req: Request, res: Response) => {
  const { order_Id, warrantyInfo } = req.body;
  await WarrantyService.updateWarrantyIntoDB(
    order_Id,
    warrantyInfo as TWarrantyInfoInput[]
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Warranty updated successfully",
  });
});

export const WarrantyController = {
  createWarranty,
  updateWarranty,
};
