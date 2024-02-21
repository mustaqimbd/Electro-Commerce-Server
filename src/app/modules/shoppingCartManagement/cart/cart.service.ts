import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import ProductModel from "../../productManagement/product/product.model";
import { TCartItem, TCartItemData } from "../cartItem/cartItem.interface";
import { CartItem } from "../cartItem/cartItem.model";
import { TCart, TCartData } from "./cart.interface";
import { Cart } from "./cart.model";

const getCartFromDB = async (
  user: TOptionalAuthGuardPayload
): Promise<TCart | null> => {
  const query = optionalAuthUserQuery(user);
  const result = await Cart.findOne(query, { cartItems: 1 }).populate([
    {
      path: "cartItems.item",
      select: "quantity product attributes",
      populate: {
        path: "product",
        select: "title slug price image.thumbnail",
        populate: [
          {
            path: "price",
            select: "salePrice regularPrice",
          },
          {
            path: "image.thumbnail",
            select: "src alt",
          },
        ],
      },
    },
  ]);
  return result;
};

const addToCartIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: TCartItemData
): Promise<void> => {
  const query = optionalAuthUserQuery(user);

  const product = await ProductModel.findOne(
    { _id: payload.product },
    { isDeleted: 1 }
  );

  if (!product || product.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to add to cart. No product available"
    );
  }

  // const isAlreadyAddedIntoCart = await CartItem.findOne({ ...query, product });
  // if (isAlreadyAddedIntoCart) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "Dear customer, this product is already added into your cart."
  //   );
  // }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // cart item creation start here
    const cartItemData: TCartItemData = {
      userId: user.id,
      sessionId: user.sessionId,
      ...payload,
    };
    const [cartItem]: TCartItem[] = await CartItem.create([cartItemData], {
      session,
    });
    if (!cartItem) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create cart item");
    }
    // cart item creation ends here

    const cartData = await Cart.findOne(query);
    if (cartData) {
      const updatedCartData = await Cart.updateOne(
        query,
        { $push: { cartItems: { item: cartItem._id } } },
        { session }
      );
      if (!updatedCartData.modifiedCount) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Failed to update cart data."
        );
      }
    } else {
      const newCartData: TCartData = {
        userId: user.id,
        sessionId: user.sessionId,
        cartItems: [{ item: cartItem._id }],
      };
      const [newCart] = await Cart.create([newCartData], { session });
      if (!newCart) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create cart");
      }
    }

    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

const updateQuantityIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: Partial<TCartItem>
) => {
  let query: Record<string, unknown> = optionalAuthUserQuery(user);

  query = { ...query, _id: payload._id };
  const cartItem = await CartItem.findOne(query);

  if (!cartItem) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No cart item found");
  }

  // const product = await Product.findOne({ _id: cartItem.id }, { quantity: 1 });
  // if (product.quantity < payload.quantity) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     `Sorry insufficient quantity. ${product.quantity}`
  //   );
  // }
  // TODO : Ensure the commented codes are working.

  cartItem.quantity = Number(payload.quantity) || 1;
  const result = await cartItem.save();
  return result;
};

const deleteFromCartFromDB = async (
  user: TOptionalAuthGuardPayload,
  payload: { itemId: mongoose.Types.ObjectId }
) => {
  const query = optionalAuthUserQuery(user);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const deletedFromCartItem = await CartItem.deleteOne({
      ...query,
      _id: payload.itemId,
    }).session(session);
    if (!deletedFromCartItem.deletedCount) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to delete item");
    }
    const deletedFromCart = await Cart.updateOne(query, {
      $pull: { cartItems: { item: payload.itemId } },
    }).session(session);
    if (!deletedFromCart.modifiedCount) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to delete from cart");
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const CartServices = {
  addToCartIntoDB,
  getCartFromDB,
  updateQuantityIntoDB,
  deleteFromCartFromDB,
};
