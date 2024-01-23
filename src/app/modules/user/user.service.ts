import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../errors/ApiError";
import { TAdmin } from "../admin/admin.interface";
import { Admins } from "../admin/admin.model";
import { TCustomer } from "../customer/customer.interface";
import { Customers } from "../customer/customer.model";
import { IStaffs } from "../staff/staff.interface";
import { Staffs } from "../staff/staff.model";
import { UserHelper } from "./user.helper";
import { TUser } from "./user.interface";
import { Users } from "./user.model";
import { createCustomerId } from "./user.util";

const createCustomer = async (
  userInfo: TUser,
  customersInfo: TCustomer,
): Promise<TUser | null> => {
  // change user role
  userInfo.role = "customer";
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = await createCustomerId();
    userInfo.id = id;
    customersInfo.uid = id;
    const [createCustomer] = await Customers.create([customersInfo], {
      session,
    });
    if (!createCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    userInfo.customer = createCustomer._id;
    const [user] = await Users.create([userInfo], { session });
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    newUser = user;
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

const createAdminOrStaff = async (
  userInfo: TUser,
  personalInfo: TAdmin | IStaffs,
): Promise<TUser | null> => {
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Create Admin or staff account base on request type
    if (userInfo.role === "admin") {
      newUser = await UserHelper.createAdminOrStaffUser(
        "admin",
        false,
        Admins,
        userInfo,
        personalInfo,
        session,
      );
    } else if (userInfo.role === "staff") {
      newUser = await UserHelper.createAdminOrStaffUser(
        "staff",
        true,
        Staffs,
        userInfo,
        personalInfo,
        session,
      );
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  newUser = await Users.findById(newUser?._id).populate(
    newUser?.role.toLowerCase() as string,
  );
  return newUser;
};

export const UsersService = {
  createCustomer,
  createAdminOrStaff,
};
