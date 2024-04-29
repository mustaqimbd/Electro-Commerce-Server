import { TCourierData } from "./courier.interface";
import { Courier } from "./courier.model";

const createCourierIntoDB = async (payload: TCourierData) => {
  const result = await Courier.create(payload);
  return result;
};

export const CourierServices = { createCourierIntoDB };
