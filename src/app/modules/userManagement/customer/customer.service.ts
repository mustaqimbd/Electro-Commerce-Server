import { PaginationHelper } from "../../../helper/pagination.helper";
import { TMetaAndDataRes } from "../../../types/common";
import { TPaginationOption } from "../../../types/pagination.types";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { TCustomer } from "./customer.interface";
import { Customer } from "./customer.model";

const getAllCustomerFromDB = async (
  paginationFields: TPaginationOption
): Promise<TMetaAndDataRes<TUser[]>> => {
  const { page, skip, limit, sortOption } =
    PaginationHelper.calculatePagination(paginationFields);

  const customers = await User.find(
    { role: "customer" },
    {
      uid: 1,
      phoneNumber: 1,
      email: 1,
      status: 1,
    }
  )
    .populate({ path: "customer", select: "fullName fullAddress" })
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await User.find({ role: "customer" }).countDocuments().lean();

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: customers,
  };
};

const updateCustomerIntoDB = async (
  user: TJwtPayload,
  payload: TCustomer
): Promise<TCustomer | null> => {
  const result = await Customer.findOneAndUpdate({ uid: user.uid }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const CustomerServices = {
  getAllCustomerFromDB,
  updateCustomerIntoDB,
};
