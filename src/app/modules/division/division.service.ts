import { Division } from "./division.model";
import { TDivision } from "./division.types";

const createIntoDB = async (payload: TDivision[]) => {
  const res = await Division.insertMany(payload);
  return res;
};

const getAllDivisionsFromDB = async () => {
  const data = await Division.find().sort({ createdAt: -1 });
  return data;
};

export const DivisionService = {
  createIntoDB,
  getAllDivisionsFromDB,
};
