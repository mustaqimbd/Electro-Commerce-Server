import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../types/common";
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
    statusCode: httpStatus.OK,
    message: "Coupon data retrieved successfully!",
    data: result,
  });
});

const updateCouponCode = catchAsync(async (req, res) => {
  await CouponServices.updateCouponCodeIntoDB(req.params.id, req.body);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Coupon updated successfully!",
  });
});

const calculateCouponDiscount = catchAsync(async (req, res) => {
  const result = await CouponServices.calculateCouponDiscount(
    req.body,
    req.user as TOptionalAuthGuardPayload
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Coupon discount calculation!",
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  getAllCoupons,
  getSingleCoupon,
  updateCouponCode,
  calculateCouponDiscount,
};
