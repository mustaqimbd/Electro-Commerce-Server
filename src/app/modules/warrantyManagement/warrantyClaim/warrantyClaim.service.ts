import { TWarrantyClaim } from "./warrantyClaim.interface";
import { WarrantyClaim } from "./warrantyClaim.model";
import { getWarrantyData } from "./warrantyClaim.utils";

const checkWarrantyFromDB = async (
  phoneNumber: string,
  warrantyCodes: string[]
) => {
  const warranty = await getWarrantyData(phoneNumber, warrantyCodes);
  return warranty;
};

const createWarrantyClaimIntoDB = async (payload: TWarrantyClaim) => {
  const result = await WarrantyClaim.create(payload);
  return result;
};

export const WarrantyClaimServices = {
  checkWarrantyFromDB,
  createWarrantyClaimIntoDB,
};
