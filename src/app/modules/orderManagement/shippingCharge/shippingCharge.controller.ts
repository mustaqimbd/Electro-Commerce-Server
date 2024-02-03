import { Request, Response } from "express";
import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TShippingCharge } from "./shippingCharge.interface";
import { ShippingChargeService } from "./shippingCharge.service";

const getShippingCharges = catchAsync(async (req: Request, res: Response) => {
  const { user } = req;
  const result = await ShippingChargeService.getShippingCharges(
    user as TOptionalAuthGuardPayload
  );
  successResponse<TShippingCharge[]>(res, {
    statusCode: httpStatus.CREATED,
    message: "User created successfully",
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
    message: "User created successfully",
    data: result,
  });
});

export const ShippingChargeController = {
  getShippingCharges,
  createShippingCharge,
};
