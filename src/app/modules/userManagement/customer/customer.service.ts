import mongoose, { PipelineStage } from "mongoose";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { Address } from "../../addressManagement/address/address.model";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { User } from "../user/user.model";
import { isEmailOrNumberTaken } from "../user/user.util";
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
  payload: Record<string, unknown>
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const userData = await User.findById(user.id).session(session);
    const { address, fullName, phoneNumber, email } = payload as {
      fullName: string;
      phoneNumber: string;
      email: string;
      address: {
        fullAddress: string;
      };
    };

    if (phoneNumber || email) {
      await isEmailOrNumberTaken({
        phoneNumber: phoneNumber,
        email: email,
      });

      await User.findOneAndUpdate(
        { _id: userData?._id },
        { phoneNumber, email },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (fullName) {
      await Customer.findOneAndUpdate(
        { _id: userData?.customer },
        { fullName },
        {
          new: true,
          runValidators: true,
          session,
        }
      );
    }

    if (address) {
      await Address.findOneAndUpdate({ _id: userData?.address }, address, {
        new: true,
        runValidators: true,
        session,
      });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const CustomerServices = {
  getAllCustomerFromDB,
  updateCustomerIntoDB,
};
