import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { DivisionService } from "./division.service";

const create = catchAsync(async (req: Request, res: Response) => {
  const data = await DivisionService.createIntoDB(req.body.divisions);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "All division created successfully!",
    data,
  });
});

const getAllDivisions = catchAsync(async (req: Request, res: Response) => {
  const data = await DivisionService.getAllDivisionsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All division retrieved successfully!",
    data,
  });
});

export const DivisionController = {
  create,
  getAllDivisions,
};
