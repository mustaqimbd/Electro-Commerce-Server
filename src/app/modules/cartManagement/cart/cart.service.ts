import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import config from "../../../config/config";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import optionalAuthUserQuery from "../../../types/optionalAuthUserQuery";
import ProductModel from "../../productManagement/product/product.model";
import { TCartItem, TCartItemData } from "../cartItem/cartItem.interface";
import { CartItem } from "../cartItem/cartItem.model";
import { CartHelper } from "./cart.helper";

const getCartFromDB = async (user: TOptionalAuthGuardPayload) => {
  const query = optionalAuthUserQuery(user);
  const pipeline: PipelineStage[] = [
    {
      $match: query,
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $lookup: {
        from: "images",
        localField: "productDetails.image.thumbnail",
        foreignField: "_id",
        as: "productImage",
      },
    },
    {
      $unwind: "$productImage",
    },
    {
      $lookup: {
        from: "prices",
        localField: "productDetails.price",
        foreignField: "_id",
        as: "defaultPrice",
      },
    },
    {
      $unwind: "$defaultPrice",
    },
    // Conditionally handle the variation if it exists
    {
      $lookup: {
        from: "products",
        let: {
          productId: "$productDetails._id",
          variationId: "$variation",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", "$$productId"] },
                  { $ne: ["$$variationId", null] }, // Ensure the variation is not null
                ],
              },
            },
          },
          {
            $project: {
              variations: {
                $filter: {
                  input: "$variations",
                  as: "variation",
                  cond: { $eq: ["$$variation._id", "$$variationId"] },
                },
              },
            },
          },
        ],
        as: "variationDetails",
      },
    },
    {
      $unwind: {
        path: "$variationDetails",
        preserveNullAndEmptyArrays: true, // In case there is no variation
      },
    },
    {
      $project: {
        product: {
          _id: "$productDetails._id",
          title: "$productDetails.title",
          image: {
            src: {
              $concat: [config.image_server, "/", "$productImage.src"],
            },
            alt: "$productImage.alt",
          },
        },
        variation: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$variation", null] }, // Ensure variation is present
                {
                  $gt: [
                    {
                      $size: {
                        $ifNull: ["$variationDetails.variations", []],
                      },
                    },
                    0,
                  ],
                }, // Ensure variationDetails.variations is non-empty
              ],
            },
            then: {
              _id: { $arrayElemAt: ["$variationDetails.variations._id", 0] },
              attributes: {
                $arrayElemAt: ["$variationDetails.variations.attributes", 0],
              },
            },
            else: "This variation is no longer available. Please select a new variation. Else you can't order the product.",
          },
        },
        price: {
          $cond: {
            if: {
              $and: [
                { $ne: ["$variation", null] }, // Ensure variation is present
                {
                  $gt: [
                    {
                      $size: {
                        $ifNull: ["$variationDetails.variations", []],
                      },
                    },
                    0,
                  ],
                }, // Ensure variationDetails.variations is non-empty
              ],
            },
            then: {
              regularPrice: {
                $arrayElemAt: [
                  "$variationDetails.variations.price.regularPrice",
                  0,
                ],
              },
              salePrice: {
                $arrayElemAt: [
                  "$variationDetails.variations.price.salePrice",
                  0,
                ],
              },
            },
            else: {
              regularPrice: "$defaultPrice.regularPrice",
              salePrice: "$defaultPrice.salePrice",
            },
          },
        },
        quantity: 1,
      },
    },
  ];

  const result = await CartItem.aggregate(pipeline);
  return result;
};

const addToCartIntoDB = async (
  user: TOptionalAuthGuardPayload,
  payload: TCartItemData
): Promise<void> => {
  const product = await ProductModel.findOne(
    { _id: payload.product },
    { isDeleted: 1, variations: 1 }
  );

  if (!product || product.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No product found");
  }

  await CartHelper.checkInventory({
    quantity: Number(payload.quantity || 1),
    item: {
      product: product?._id as Types.ObjectId,
      variation: payload.variation as Types.ObjectId,
    },
  });

  if (product.variations.length) {
    if (!payload.variation)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No variation has been selected"
      );
  } else {
    payload.variation = undefined;
  }

  const cartItemData: TCartItemData = {
    userId: user.id,
    sessionId: user.sessionId,
    ...payload,
  };

  await CartItem.create(cartItemData);
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

  await CartHelper.checkInventory({
    quantity: Number(payload.quantity || 1),
    item: {
      product: cartItem?.product as Types.ObjectId,
      variation: cartItem?.variation as Types.ObjectId,
    },
  });

  cartItem.quantity = Number(payload.quantity) || 1;
  await cartItem.save();
};

const deleteFromCartFromDB = async (
  user: TOptionalAuthGuardPayload,
  payload: { itemId: mongoose.Types.ObjectId }
) => {
  const query = optionalAuthUserQuery(user);
  await CartItem.deleteOne({
    ...query,
    _id: payload.itemId,
  });
};

export const CartServices = {
  addToCartIntoDB,
  getCartFromDB,
  updateQuantityIntoDB,
  deleteFromCartFromDB,
};
