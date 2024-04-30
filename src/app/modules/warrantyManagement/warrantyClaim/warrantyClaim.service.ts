import { getWarrantyData } from "./warrantyClaim.utils";

const checkWarrantyFromDB = async (
  phoneNumber: string,
  warrantyCode: string
) => {
  const warranty = await getWarrantyData(phoneNumber, warrantyCode);
  return warranty;
};

// const createWarrantyClaimIntoDB = async (payload: TWarrantyClaim) => {};

export const WarrantyClaimServices = { checkWarrantyFromDB };
