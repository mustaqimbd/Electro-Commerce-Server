import { District } from "./district.model";
import { TDistrict } from "./district.types";

const createIntoDB = async (payload: TDistrict[]) => {
  const res = await District.insertMany(payload);
  return res;
};

const getAllDistrictsFromDB = async () => {
  const data = await District.find().sort({ createdAt: -1 });
  return data;
};

export const DistrictService = {
  createIntoDB,
  getAllDistrictsFromDB,
};
