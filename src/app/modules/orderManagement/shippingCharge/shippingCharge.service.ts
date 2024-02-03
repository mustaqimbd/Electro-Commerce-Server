import { TOptionalAuthGuardPayload } from "../../../types/common";
import {
  TShippingCharge,
  TShippingChargeData,
} from "./shippingCharge.interface";
import { ShippingCharge } from "./shippingCharge.model";

const getShippingCharges = async (
  user: TOptionalAuthGuardPayload
): Promise<TShippingCharge[]> => {
  if (user.role === "admin" || user.role === "staff") {
    const result = await ShippingCharge.find().populate("createdBy");
    return result;
  } else {
    const result = await ShippingCharge.find({}, { name: 1, amount: 1 });
    return result;
  }
};

const createShippingChargeIntoDB = async (
  payload: TShippingChargeData
): Promise<TShippingCharge> => {
  const result = await ShippingCharge.create(payload);
  return result;
};

export const ShippingChargeService = {
  createShippingChargeIntoDB,
  getShippingCharges,
};
