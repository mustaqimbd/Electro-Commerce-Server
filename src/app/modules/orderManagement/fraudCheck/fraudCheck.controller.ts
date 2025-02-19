import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { FraudCheckServices } from "./fraudCheck.service";

const fraudCheck = catchAsync(async (req: Request, res: Response) => {
  const { mobile } = req.params;
  const result = await FraudCheckServices.fraudCheckDB(mobile);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Fraud check data retrieved successfully",
    data: result,
  });
});

export const FraudCheckController = {
  fraudCheck,
};
