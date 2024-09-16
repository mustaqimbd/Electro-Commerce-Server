import { Request, Response } from "express";
import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TShippingCharge } from "./shippingCharge.interface";
import { ShippingChargeService } from "./shippingCharge.service";

const getShippingCharges = catchAsync(async (req: Request, res: Response) => {
  const { user } = req;
  const result = await ShippingChargeService.getShippingCharges(
    user as TOptionalAuthGuardPayload
  );
  successResponse<TShippingCharge[]>(res, {
    statusCode: httpStatus.OK,
    message: "Shipping charges retrieved successfully",
    data: result,
  });
});

const createShippingCharge = catchAsync(async (req: Request, res: Response) => {
  const result = await ShippingChargeService.createShippingChargeIntoDB({
    createdBy: req?.user?.id,
    ...req?.body,
  });
  successResponse<TShippingCharge>(res, {
    statusCode: httpStatus.CREATED,
    message: "Created shipping charge successfully",
    data: result,
  });
});

const updateShippingCharge = catchAsync(async (req: Request, res: Response) => {
  const result = await ShippingChargeService.updateShippingChangeIntoDB(
    req.params.id,
    req.body as unknown as Record<string, unknown>,
    req.user as unknown as TJwtPayload
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Shipping charge updated successfully",
    data: result,
  });
});

export const ShippingChargeController = {
  getShippingCharges,
  createShippingCharge,
  updateShippingCharge,
};
