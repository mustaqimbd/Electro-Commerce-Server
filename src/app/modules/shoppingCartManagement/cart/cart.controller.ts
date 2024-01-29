import { Request, Response } from "express";
import httpStatus from "http-status";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { TCart } from "./cart.interface";
import { CartServices } from "./cart.service";

const getCartInfo = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const result = await CartServices.getCartFromDB(user);
  successResponse<TCart>(res, {
    statusCode: httpStatus.OK,
    message: "Cart info retrieved successfully",
    data: result,
  });
});

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  await CartServices.addToCartIntoDB(user, req.body);
  successResponse<TCart>(res, {
    statusCode: httpStatus.CREATED,
    message: "Added to cart successfully",
  });
});

const updateQuantity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  const payload = { ...req.body, _id: req.body.cartItemId };
  await CartServices.updateQuantityIntoDB(user, payload);
  successResponse<TCart>(res, {
    statusCode: httpStatus.CREATED,
    message: "Quantity updated",
  });
});

const deleteFromCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as TOptionalAuthGuardPayload;
  await CartServices.deleteFromCartFromDB(user, req.body);
  successResponse<TCart>(res, {
    statusCode: httpStatus.OK,
    message: "Deleted successfully",
  });
});

export const CartController = {
  addToCart,
  getCartInfo,
  updateQuantity,
  deleteFromCart,
};
