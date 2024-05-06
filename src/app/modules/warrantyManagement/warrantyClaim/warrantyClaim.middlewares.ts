import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import catchAsync from "../../../utilities/catchAsync";
import { WarrantyClaimUtils } from "./warrantyClaim.utils";

const validateWarranty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, warrantyCodes } = req.body;
    await WarrantyClaimUtils.ifAlreadyClaimRequestPending(phoneNumber);
    const warranties = await WarrantyClaimUtils.getWarrantyData(
      phoneNumber,
      warrantyCodes
    );
    // console.log(16, warranties);
    if (!warranties.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid request");
    }
    const warrantyClaimReqData: Record<string, unknown>[] = [];

    warranties.forEach((warranty) => {
      (
        warranty.products as {
          _id: Types.ObjectId;
          warranty: { warrantyCodes: { code: string }[]; endsDate: string };
        }[]
      ).map((product) => {
        const endsDate = new Date(product?.warranty?.endsDate);
        const today = new Date();

        if (today > endsDate) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Please check again your warranty codes`
          );
        }

        const data: Record<string, unknown> = {
          order_id: warranty._id,
        };
        data.orderItemId = product._id;
        data.claimedCodes = product?.warranty?.warrantyCodes
          .map((item) =>
            warrantyCodes.includes(item.code) ? item.code : undefined
          )
          .filter(Boolean);
        warrantyClaimReqData.push(data);
      });
    });

    req.anyData = warrantyClaimReqData;
    next();
  }
);

const parseFormData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, shipping, warrantyCodes, problemInDetails } = req.body;
    const { fullName, fullAddress, phoneNumber: shippingPhone } = shipping;
    req.body = {
      phoneNumber,
      warrantyCodes,
      shipping: { fullName, fullAddress, phoneNumber: shippingPhone },
      problemInDetails,
    };
    next();
  }
);

export const WarrantyClaimMiddlewares = { validateWarranty, parseFormData };
