import { PipelineStage } from "mongoose";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { User } from "../user/user.model";
import { TCustomer } from "./customer.interface";
import { Customer } from "./customer.model";

const getAllCustomerFromDB = async (query: Record<string, unknown>) => {
  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerData",
      },
    },
    {
      $unwind: "$customerData",
    },
    {
      $project: {
        uid: 1,
        phoneNumber: 1,
        email: 1,
        name: "$customerData.fullName",
        address: "$customerData.address",
        status: 1,
        createdAt: 1,
      },
    },
  ];

  const matchQuery = {
    $match: {
      role: "customer",
    },
  };

  pipeline.unshift(matchQuery);

  const customerQuery = new AggregateQueryHelper(
    User.aggregate(pipeline),
    query
  )
    .sort()
    .paginate();

  const data = await customerQuery.model;
  const total =
    (await User.aggregate([matchQuery, { $count: "total" }]))![0]?.total || 0;
  const meta = customerQuery.metaData(total);

  return {
    meta,
    data,
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
