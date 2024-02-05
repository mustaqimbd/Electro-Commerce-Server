import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TAdmin } from "./admin.interface";
import { AdminServices } from "./admin.service";

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.updateAdminIntoDB(
    req.user as TJwtPayload,
    req.body
  );

  successResponse<TAdmin>(res, {
    statusCode: httpStatus.OK,
    data: result,
  });
});

export const AdminControllers = { updateAdmin };
