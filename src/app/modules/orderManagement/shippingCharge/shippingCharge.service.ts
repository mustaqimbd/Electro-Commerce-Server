import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TOptionalAuthGuardPayload } from "../../../types/common";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import {
  TShippingCharge,
  TShippingChargeData,
} from "./shippingCharge.interface";
import { ShippingCharge } from "./shippingCharge.model";

const getShippingCharges = async (
  user: TOptionalAuthGuardPayload
): Promise<TShippingCharge[]> => {
  if (["admin", "staff"].includes(user.role || "")) {
    const result = await ShippingCharge.find(
      { isDeleted: false },
      { name: 1, description: 1, amount: 1, isActive: 1, createdAt: 1 }
    );
    return result;
  } else {
    const result = await ShippingCharge.find(
      { isDeleted: false },
      { name: 1, amount: 1, description: 1 }
    );
    return result;
  }
};

const createShippingChargeIntoDB = async (
  payload: TShippingChargeData
): Promise<TShippingCharge> => {
  const result = await ShippingCharge.create(payload);
  return result;
};

const updateShippingChangeIntoDB = async (
  id: string,
  payload: Record<string, unknown>,
  user: TJwtPayload
) => {
  const previousData = await ShippingCharge.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!previousData) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No shipping charge found.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    if (Number(payload.amount) > -1 && payload.amount !== previousData.amount) {
      // Mark previous data as deleted
      previousData.name = `${previousData.name} - ${previousData.amount}`;
      previousData.isDeleted = true;
      await previousData.save({ session });

      // Create a new document for the updated shipping charge
      const newShippingCharge = new ShippingCharge({
        name: payload.name || previousData.name,
        description: payload.description || previousData.description,
        amount: payload.amount as number,
        createdBy: user.id,
        isActive: payload.isActive || true,
        isDeleted: false,
      });
      await ShippingCharge.create([newShippingCharge], {
        session,
      });
    } else {
      previousData.name = payload.name as string;
      previousData.description = payload.description as string;
      previousData.isActive =
        (payload.isActive as boolean) || previousData.isActive;
      previousData.isDeleted = (payload.isDeleted as boolean) || false;
      await previousData.save({ session });
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const ShippingChargeService = {
  createShippingChargeIntoDB,
  getShippingCharges,
  updateShippingChangeIntoDB,
};
