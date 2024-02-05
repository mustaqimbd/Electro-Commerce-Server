import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { TAddressData } from "../../../types/address";
import { Address } from "../../addressManagement/address/address.model";
import { authHelpers } from "../../authManagement/auth/auth.helper";
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

const createCustomerIntoDB = async (
  personalInfo: TCustomer,
  addressData: TAddressData,
  userInfo: TUser,
  req: Request
) => {
  // check that the phone number is already registered
  const isExist = await User.findOne({ phoneNumber: userInfo.phoneNumber });
  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this number"
    );
  }
  // change user role
  userInfo.role = "customer";
  let newUser = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = await createCustomerId();

    personalInfo.uid = id;
    // create customer
    const [createCustomer] = await Customer.create([personalInfo], {
      session,
    });
    if (!createCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create user");
    }

    addressData.uid = id;
    // create address
    const [address] = await Address.create([addressData], { session });

    if (!address) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Failed to create address");
    }

    userInfo.uid = id;
    userInfo.customer = createCustomer._id;
    userInfo.address = address._id;
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
    newUser = await User.findOne(
      { _id: newUser._id },
      { uid: 1, role: 1, phoneNumber: 1, email: 1, customer: 1 }
    ).populate([{ path: "customer", select: "fullName -_id" }]);
  }

  const authData = await authHelpers.loginUser(req, newUser);

  return { newUser, authData };
};

const createAdminOrStaffIntoDB = async (
  personalInfo: TAdmin | TStaff,
  address: TAddressData,
  userInfo: TUser
): Promise<TUser | null> => {
  // check that the phone number is already registered
  const isExist = await User.findOne({ phoneNumber: userInfo.phoneNumber });
  if (isExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this number"
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
        Admin,
        userInfo,
        personalInfo,
        address,
        session
      );
    } else if (userInfo.role === "staff") {
      newUser = await UserHelpers.createAdminOrStaffUser(
        "staff",
        Staff,
        userInfo,
        personalInfo,
        address,
        session
      );
    }
    await session.commitTransaction();
    await session.endSession();
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
  newUser = await User.findById(newUser?._id).populate([
    {
      path: newUser?.role.toLowerCase() as string,
      select: "-createdAt -updatedAt",
    },
    { path: "address", select: "-createdAt -updatedAt" },
  ]);
  return newUser;
};

const geUserProfileFromDB = async (
  id: Types.ObjectId
): Promise<TUser | null> => {
  const propsForAdminANdStaff = "fullName profilePicture -_id";
  const result = await User.findById(id, {
    role: 1,
    phoneNumber: 1,
    email: 1,
    permissions: 1,
    status: 1,
    customer: 1,
    admin: 1,
    staff: 1,
  }).populate([
    { path: "customer" },
    {
      path: "staff",
      select: propsForAdminANdStaff,
    },
    {
      path: "admin",
      select: propsForAdminANdStaff,
    },
    {
      path: "permissions",
      select: "name -_id",
    },
  ]);
  return result;
};

export const UserServices = {
  createCustomerIntoDB,
  createAdminOrStaffIntoDB,
  geUserProfileFromDB,
};
