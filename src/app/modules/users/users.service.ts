import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ICustomers } from "../customers/customers.interface";
import { Customers } from "../customers/customers.model";
import { IUser } from "./users.interface";
import { Users } from "./users.model";
import { createCustomerId } from "./users.util";

const createCustomer = async (
  userInfo: IUser,
  customersInfo: ICustomers,
): Promise<IUser | null> => {
  // change user role
  userInfo.role = "customer";

  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = await createCustomerId();
    userInfo.id = id;
    customersInfo.uid = id;
    const createCustomer = await Customers.create([customersInfo], [session]);
    if (!createCustomer.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    userInfo.customer = createCustomer[0]._id;
    const user = await Users.create([userInfo], [session]);
    if (!user.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    newUser = user[0];
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  if (newUser) {
    newUser = await Users.findOne({ _id: newUser._id }).populate("customer");
  }
  return newUser;
};

export const UsersService = {
  createCustomer,
};
