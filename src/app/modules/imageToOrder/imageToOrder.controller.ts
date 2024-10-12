import { Request, Response } from "express";
import httpStatus from "http-status";
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

export const ImageToOrderController = {
  createReq,
};
