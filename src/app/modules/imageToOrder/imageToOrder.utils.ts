import { createOrderId } from "../orderManagement/order/order.utils";

const createReqId = () => createOrderId();

export const ImageToOrderUtils = {
  createReqId,
};
