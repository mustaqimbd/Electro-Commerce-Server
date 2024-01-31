import { TPaymentData } from "../payment/payment.interface";
import { TShippingData } from "../shipping/shipping.interface";

const createOrderIntoDB = async (
  payment: TPaymentData,
  shipping: TShippingData
) => {
  // eslint-disable-next-line no-console
  console.log(payment, shipping);
};

export const OrderServices = {
  createOrderIntoDB,
};
