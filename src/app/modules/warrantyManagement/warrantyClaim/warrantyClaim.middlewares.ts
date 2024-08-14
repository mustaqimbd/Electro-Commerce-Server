import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../utilities/catchAsync";
import { WarrantyClaimUtils } from "./warrantyClaim.utils";

const validateWarrantyMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { phoneNumber, warrantyCodes } = req.body;
    await WarrantyClaimUtils.ifAlreadyClaimRequestPending(phoneNumber);
    const warrantyClaimReqData = await WarrantyClaimUtils.validateWarranty({
      phoneNumber,
      warrantyCodes,
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

export const WarrantyClaimMiddlewares = {
  validateWarrantyMiddleware,
  parseFormData,
};
