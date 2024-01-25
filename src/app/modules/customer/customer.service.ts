import { PaginationHelper } from "../../helper/pagination.helper";
import { TMetaAndDataRes } from "../../types/common";
import { TPaginationOption } from "../../types/pagination.types";
import { TUser } from "../user/user.interface";
import { User } from "../user/user.model";

const getAllCustomer = async (
  paginationFields: TPaginationOption,
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
    },
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

export const CustomerServices = {
  getAllCustomer,
};
