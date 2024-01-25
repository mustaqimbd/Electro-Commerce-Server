import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../errorHandlers/ApiError";
import { TAdmin } from "../admin/admin.interface";
import { Admin } from "../admin/admin.model";
import { TCustomer } from "../customer/customer.interface";
import { Customer } from "../customer/customer.model";
import { TStaff } from "../staff/staff.interface";
import { Staff } from "../staff/staff.model";
import { UserHelpers } from "./user.helper";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import { createCustomerId } from "./user.util";

const createCustomer = async (
  userInfo: TUser,
  customerInfo: TCustomer,
): Promise<TUser | null> => {
  // check that the phone number is already registered
  const isExist = await User.findOne({ phoneNumber: userInfo.phoneNumber });
  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this number",
    );
  }
  // change user role
  userInfo.role = "customer";
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = await createCustomerId();
    userInfo.uid = id;
    customerInfo.uid = id;

    const [createCustomer] = await Customer.create([customerInfo], {
      session,
    });
    if (!createCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }
    userInfo.customer = createCustomer._id;
    const [user] = await User.create([userInfo], { session });
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
    newUser = await User.findOne({ _id: newUser._id }).populate("customer");
  }
  return newUser;
};

const createAdminOrStaff = async (
  userInfo: TUser,
  personalInfo: TAdmin | TStaff,
): Promise<TUser | null> => {
  // check that the phone number is already registered
  const isExist = await User.findOne({ phoneNumber: userInfo.phoneNumber });
  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this number",
    );
  }
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Create Admin or staff account base on request type
    if (userInfo.role === "admin") {
      newUser = await UserHelpers.createAdminOrStaffUser(
        "admin",
        false,
        Admin,
        userInfo,
        personalInfo,
        session,
      );
    } else if (userInfo.role === "staff") {
      newUser = await UserHelpers.createAdminOrStaffUser(
        "staff",
        true,
        Staff,
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
  newUser = await User.findById(newUser?._id).populate(
    newUser?.role.toLowerCase() as string,
  );
  return newUser;
};

export const UserServices = {
  createCustomer,
  createAdminOrStaff,
};
