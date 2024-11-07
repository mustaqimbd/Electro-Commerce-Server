import httpStatus from "http-status";
import catchAsync from "../../utilities/catchAsync";
import successResponse from "../../utilities/successResponse";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { CouponServices } from "./coupon.service";

const createCoupon = catchAsync(async (req, res) => {
  await CouponServices.createCouponIntoDB(
    req.body,
    req.user as unknown as TJwtPayload
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Coupon created successfully!",
  });
});

const getAllCoupons = catchAsync(async (req, res) => {
  const { data, meta } = await CouponServices.getAllCouponsFromBD(
    req.query as unknown as Record<string, string>
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All available coupon retrieved successfully!",
    data,
    meta,
  });
});

const getSingleCoupon = catchAsync(async (req, res) => {
  const result = await CouponServices.getSingleCouponFromBD(req.params.code);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Coupon data retrieved successfully!",
    data: result,
  });
});

const updateCouponCode = catchAsync(async (req, res) => {
  await CouponServices.updateCouponCodeIntoDB(req.params.id, req.body);
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Coupon updated successfully!",
  });
});

export const CouponController = {
  createCoupon,
  getAllCoupons,
  getSingleCoupon,
  updateCouponCode,
};
