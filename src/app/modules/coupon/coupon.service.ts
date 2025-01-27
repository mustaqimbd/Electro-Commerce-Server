import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../helper/query.helper";
import { TOptionalAuthGuardPayload } from "../../types/common";
import optionalAuthUserQuery from "../../types/optionalAuthUserQuery";
import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { OrderHelper } from "../orderManagement/order/order.helper";
import {
  TProductDetails,
  TSanitizedOrProduct,
} from "../orderManagement/order/order.interface";
import { TCouponData } from "./coupon.interface";
import { Coupon } from "./coupon.model";

const createCouponIntoDB = async (payload: TCouponData, user: TJwtPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const isAlreadyExist = await Coupon.findOne({ code: payload.code }).session(
      session
    );
    if (isAlreadyExist)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `An coupon already exist with this code - ${payload.code}`
      );

    const today = new Date(Date.now());

    if (payload.startDate) {
      const startDate = new Date(payload.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid start date input");
      }

      if (today < startDate)
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "The selected start date must be a future date."
        );
    } else {
      payload.startDate = new Date(Date.now());
    }

    const endDate = new Date(payload.endDate);

    if (isNaN(endDate.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid end date input");
    }
    if (today > endDate)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "The selected end date must be a future date."
      );

    // priorities the products
    if (
      payload?.fixedCategories?.length &&
      payload?.fixedProducts?.length &&
      payload?.restrictedCategories?.length
    ) {
      payload.fixedCategories = undefined;
      payload.restrictedCategories = undefined;
    } else if (
      !payload?.fixedProducts?.length &&
      payload?.fixedCategories?.length &&
      payload?.restrictedCategories?.length
    ) {
      // keep the restricted condition
      payload.fixedCategories = undefined;
    }

    payload.slug = payload.name.toLocaleLowerCase().split(" ").join("-");
    payload.createdBy = user.id;
    await Coupon.create([payload], { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllCouponsFromBD = async (query: Record<string, string>) => {
  const pipeline: PipelineStage[] = [
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        shortDescription: 1,
        code: 1,
        percentage: 1,
        endDate: 1,
        maxDiscountAmount: 1,
        limitDiscountAmount: 1,
        isActive: 1,
        isDeleted: 1,
        createdAt: 1,
      },
    },
  ];

  const couponQuery = new AggregateQueryHelper(
    Coupon.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const total = (await Coupon.aggregate([{ $count: "total" }]))![0]?.total || 0;
  const meta = couponQuery.metaData(total);

  const data = await couponQuery.model;

  return { data, meta };
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
      createdAt: 1,
    }
  );
  if (!result) throw new ApiError(httpStatus.BAD_REQUEST, "No coupon found");
  return result;
};

const updateCouponCodeIntoDB = async (id: string, payload: TCouponData) => {
  const isExist = await Coupon.findOne({
    _id: new Types.ObjectId(id),
    isDeleted: false,
  });

  if (!isExist)
    throw new ApiError(httpStatus.BAD_REQUEST, "No coupon data found");

  if (payload.endDate) {
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
    payload.endDate = endDate;
  }

  await Coupon.updateOne(
    {
      _id: new Types.ObjectId(id),
      isDeleted: false,
    },
    {
      $set: {
        isActive: payload.isActive,
        isDeleted: payload.isDeleted,
        endDate: payload.endDate,
      },
    }
  );
};

const calculateCouponDiscount = async (
  body: {
    shippingCharge: mongoose.Types.ObjectId;
    salesPage: boolean;
    orderedProducts: TProductDetails[];
    coupon?: string;
  },
  user: TOptionalAuthGuardPayload
) => {
  const userQuery = optionalAuthUserQuery(user);

  userQuery.userId = userQuery.userId
    ? new Types.ObjectId(userQuery.userId)
    : undefined;
  const { shippingCharge, orderedProducts, salesPage, coupon } = body;

  if (!coupon)
    throw new ApiError(httpStatus.BAD_REQUEST, "Please add a coupon.");

  let orderedProductInfo: TSanitizedOrProduct[] = [];
  if (salesPage) {
    orderedProductInfo =
      await OrderHelper.sanitizeOrderedProducts(orderedProducts);
  } else {
    const cart = await OrderHelper.sanitizeCartItemsForOrder(userQuery);
    orderedProductInfo = cart;
  }
  const { cost } =
    OrderHelper.validateAndSanitizeOrderedProducts(orderedProductInfo);

  const { couponDiscount, shippingChange } =
    await OrderHelper.orderCostAfterCoupon(
      cost,
      shippingCharge.toString(),
      orderedProductInfo,
      { couponCode: coupon, user }
    );

  return { couponDiscount, shippingChange, cost };
};

const getAllTagsFromDB = async () => {
  const tags = (
    await Coupon.aggregate([
      {
        $unwind: "$tags",
      },
      {
        $group: {
          _id: null,
          tags: { $addToSet: "$tags" },
        },
      },
      {
        $project: {
          _id: 0,
          tags: 1,
        },
      },
    ])
  )[0];

  return tags;
};

export const CouponServices = {
  createCouponIntoDB,
  getAllCouponsFromBD,
  getSingleCouponFromBD,
  updateCouponCodeIntoDB,
  calculateCouponDiscount,
  getAllTagsFromDB,
};
