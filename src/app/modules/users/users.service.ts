import httpStatus from "http-status";
import mongoose from "mongoose";
import ApiError from "../../../errors/ApiError";
import { IAdmins } from "../admins/admins.interface";
import { Admins } from "../admins/admins.model";
import { ICustomers } from "../customers/customers.interface";
import { Customers } from "../customers/customers.model";
import { IStaffs } from "../staffs/staff.interface";
import { Staffs } from "../staffs/staff.model";
import { UserHelper } from "./users.helper";
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
  userInfo: IUser,
  personalInfo: IAdmins | IStaffs,
): Promise<IUser | null> => {
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
