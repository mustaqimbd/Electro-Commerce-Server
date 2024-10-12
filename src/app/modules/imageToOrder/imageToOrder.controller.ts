import { Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import { TOptionalAuthGuardPayload } from "../../types/common";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { ImageToOrderService } from "./imageToOrder.service";

const createReq = catchAsync(async (req: Request, res: Response) => {
  const filesInfo = (req?.files as Express.Multer.File[])?.map((file) => ({
    path: file.path,
  }));

  req.body.images = filesInfo;
  const result = await ImageToOrderService.createIntoDB(
    req.user as TOptionalAuthGuardPayload,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Image to order request created successfully",
    data: result,
  });
});

const getAllReqAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await ImageToOrderService.getAllReqAdminFromDB();

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Image to order request retrieved successfully",
    data: result,
  });
});

const updateReqByAdmin = catchAsync(async (req: Request, res: Response) => {
  const reqId = req.params.id;
  const result = await ImageToOrderService.updateReqByAdminIntoDB(
    reqId as unknown as Types.ObjectId,
    req.body
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Image to order request updated successfully",
    data: result,
  });
});

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const reqId = req.params.id;
  const result = await ImageToOrderService.createOrderIntoDB(
    reqId as unknown as Types.ObjectId,
    req
  );

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "New order created successfully",
    data: result,
  });
});

export const ImageToOrderController = {
  createReq,
  getAllReqAdmin,
  updateReqByAdmin,
  createOrder,
};
