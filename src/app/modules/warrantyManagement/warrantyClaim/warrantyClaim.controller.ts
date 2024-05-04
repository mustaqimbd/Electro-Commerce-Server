import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { WarrantyClaimServices } from "./warrantyClaim.service";

const getAllWarrantyClaimReq = catchAsync(
  async (req: Request, res: Response) => {
    const { meta, data } =
      await WarrantyClaimServices.getAllWarrantyClaimReqFromDB(
        req.query as unknown as Record<string, string>
      );
    successResponse(res, {
      statusCode: httpStatus.OK,
      message: "Warranty details retrieved successfully",
      meta,
      data,
    });
  }
);

const checkWarranty = catchAsync(async (req: Request, res: Response) => {
  const { phoneNumber, warrantyCodes } = req.body;
  const warranty = await WarrantyClaimServices.checkWarrantyFromDB(
    phoneNumber,
    warrantyCodes
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Warranty details retrieved successfully",
    data: warranty,
  });
});

const createWarrantyClaimReq = catchAsync(
  async (req: Request, res: Response) => {
    const filesInfo = (req?.files as Express.Multer.File[])?.map((file) => ({
      path: file.path,
      fileType: file.mimetype.split("/")[0],
    }));

    const payload = {
      warrantyClaimReqData: req.anyData,
      ...req.body,
      videosAndImages: filesInfo,
    };
    const warranty =
      await WarrantyClaimServices.createWarrantyClaimIntoDB(payload);
    successResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Warranty claim request created successfully",
      data: warranty,
    });
  }
);

export const WarrantyClaimController = {
  getAllWarrantyClaimReq,
  checkWarranty,
  createWarrantyClaimReq,
};
