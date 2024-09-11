import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { TCouponData } from "./coupon.interface";
import { Coupon } from "./coupon.model";

const createCouponIntoDB = async (payload: TCouponData, user: TJwtPayload) => {
  const today = new Date(Date.now());
  const endDate = new Date(payload.endDate);

  if (isNaN(endDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date input");
  }
  if (today > endDate)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "The selected end date must be a future date."
    );
  payload.slug = payload.name.toLocaleLowerCase().split(" ").join("-");
  payload.createdBy = user.id;
  await Coupon.create(payload);
};

const getAllCouponsFromBD = async () => {
  const today = new Date(Date.now());
  const result = await Coupon.find(
    { isActive: true, isDeleted: false, endDate: { $gt: today } },
    {
      name: 1,
      slug: 1,
      shortDescription: 1,
      code: 1,
      percentage: 1,
      endDate: 1,
      maxDiscountAmount: 1,
      limitDiscountAmount: 1,
      isActive: 1,
    }
  );
  return result;
};

const getSingleCouponFromBD = async (couponCode: string) => {
  const today = new Date(Date.now());
  const result = await Coupon.findOne(
    {
      code: couponCode,
      isActive: true,
      isDeleted: false,
      endDate: { $gt: today },
    },
    {
      name: 1,
      slug: 1,
      shortDescription: 1,
      code: 1,
      percentage: 1,
      endDate: 1,
      maxDiscountAmount: 1,
      limitDiscountAmount: 1,
      isActive: 1,
    }
  );
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "No coupon found");
  return result;
};

const updateCouponCodeIntoDB = async (id: string, payload: TCouponData) => {
  const isExist = await Coupon.findOne({
    id: new Types.ObjectId(id),
    isDeleted: false,
  });
  if (!isExist)
    throw new ApiError(httpStatus.BAD_REQUEST, "No coupon data found");

  await Coupon.updateOne(
    {
      _id: new Types.ObjectId(id),
      isDeleted: false,
    },
    { $set: { isActive: payload.isActive, isDeleted: payload.isDeleted } }
  );
};

export const CouponServices = {
  createCouponIntoDB,
  getAllCouponsFromBD,
  getSingleCouponFromBD,
  updateCouponCodeIntoDB,
};
