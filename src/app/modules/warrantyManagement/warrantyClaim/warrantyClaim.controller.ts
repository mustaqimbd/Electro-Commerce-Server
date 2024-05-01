import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { WarrantyClaimServices } from "./warrantyClaim.service";

const updateWarranty = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumber, warrantyCode } = req.body;
  const warranty = await WarrantyClaimServices.checkWarrantyFromDB(
    phoneNumber,
    warrantyCode
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Warranty details retrieved successfully",
    data: warranty,
  });
});

export const WarrantyClaimController = {
  updateWarranty,
};
