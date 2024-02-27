import { TJwtPayload } from "../authManagement/auth/auth.interface";
import { TPaymentMethod } from "./paymentMethod.interface";
import { PaymentMethod } from "./paymentMethod.model";

const getAllPaymentMethodsFromDB = async (): Promise<TPaymentMethod[]> => {
  const result = await PaymentMethod.find(
    { isDeleted: false },
    { createdBy: 0, isDeleted: 0 }
  ).populate([
    {
      path: "image",
      select: "src alt",
    },
  ]);
  return result;
};

const createPaymentMethod = async (
  payload: TPaymentMethod,
  user: TJwtPayload
): Promise<TPaymentMethod> => {
  const result = PaymentMethod.create({ ...payload, createdBy: user.id });
  return result;
};

export const PaymentMethodService = {
  getAllPaymentMethodsFromDB,
  createPaymentMethod,
};
