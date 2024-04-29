import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { CourierServices } from "./courier.service";

const createCourier = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierServices.createCourierIntoDB(req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Courier created successfully",
    data: result,
  });
});

export const CourierController = {
  createCourier,
};
