import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { DistrictService } from "./district.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await DistrictService.createIntoDB(req.body.districts);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "All district created successfully!",
    data,
  });
});

const getAllDistricts = catchAsync(async (req: Request, res: Response) => {
  const data = await DistrictService.getAllDistrictsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All district retrieved successfully!",
    data,
  });
});

export const DistrictController = {
  create,
  getAllDistricts,
};
