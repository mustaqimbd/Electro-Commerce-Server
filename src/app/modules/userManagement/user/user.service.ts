import { Request } from "express";
import httpStatus from "http-status";
import mongoose, { PipelineStage, Types } from "mongoose";
import ApiError from "../../../errorHandlers/ApiError";
import { AggregateQueryHelper } from "../../../helper/query.helper";
import { TAddressData } from "../../../types/address";
import { Address } from "../../addressManagement/address/address.model";
import { authHelpers } from "../../authManagement/auth/auth.helper";
import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TAdmin } from "../admin/admin.interface";
import { Admin } from "../admin/admin.model";
import { TCustomer } from "../customer/customer.interface";
import { Customer } from "../customer/customer.model";
import { TStaff } from "../staff/staff.interface";
import { Staff } from "../staff/staff.model";
import { UserHelpers } from "./user.helper";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import { createCustomerId, createSwitchField } from "./user.util";

const getAllAdminAndStaffFromDB = async (
  query: Record<string, string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user: TJwtPayload
) => {
  const matchQuery = {
    role: { $in: ["admin", "staff"] },
    status: { $ne: "deleted" },
  };

  const pipeline: PipelineStage[] = [
    { $match: { ...matchQuery } },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "admin",
      },
    },
    {
      $lookup: {
        from: "staffs",
        localField: "staff",
        foreignField: "_id",
        as: "staff",
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    {
      $project: {
        _id: 1,
        uid: 1,
        role: 1,
        phoneNumber: 1,
        email: 1,
        status: 1,
        fullName: {
          $cond: {
            if: { $eq: ["$role", "admin"] },
            then: { $arrayElemAt: ["$admin.fullName", 0] },
            else: {
              $cond: {
                if: { $eq: ["$role", "staff"] },
                then: { $arrayElemAt: ["$staff.fullName", 0] },
                else: { $arrayElemAt: ["$customer.fullName", 0] },
              },
            },
          },
        },
        profilePicture: {
          $cond: {
            if: { $eq: ["$role", "admin"] },
            then: { $arrayElemAt: ["$admin.profilePicture", 0] },
            else: {
              $cond: {
                if: { $eq: ["$role", "staff"] },
                then: { $arrayElemAt: ["$staff.profilePicture", 0] },
                else: { $arrayElemAt: ["$customer.profilePicture", 0] },
              },
            },
          },
        },
        permissions: 1,
      },
    },
    {
      $unwind: {
        path: "$permissions",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "permissions",
        localField: "permissions",
        foreignField: "_id",
        as: "permissionsData",
      },
    },
    {
      $unwind: {
        path: "$permissionsData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          _id: "$_id",
          uid: "$uid",
          role: "$role",
          phoneNumber: "$phoneNumber",
          email: "$email",
          status: "$status",
          fullName: "$fullName",
          profilePicture: "$profilePicture",
        },
        permissions: { $addToSet: "$permissionsData.name" },
      },
    },
    {
      $project: {
        _id: "$_id._id",
        uid: "$_id.uid",
        role: "$_id.role",
        phoneNumber: "$_id.phoneNumber",
        email: "$_id.email",
        status: "$_id.status",
        fullName: "$_id.fullName",
        profilePicture: "$_id.profilePicture",
        permissions: 1,
      },
    },
  ];
  const usersQuery = new AggregateQueryHelper(User.aggregate(pipeline), query)
    .sort()
    .paginate();
  const data = await usersQuery.model;
  const total =
    (await User.aggregate([{ $match: matchQuery }, { $count: "total" }]))![0]
      ?.total || 0;
  const meta = usersQuery.metaData(total);
  return { data, meta };
};

const createCustomerIntoDB = async (
  personalInfo: TCustomer,
  addressData: TAddressData,
  userInfo: TUser,
  req: Request
) => {
  // check that the phone number is already registered
  const isExist = await User.find({
    $or: [{ phoneNumber: userInfo.phoneNumber }, { email: userInfo.email }],
  });

  if (isExist.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this number or email"
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
  const isExist = await User.find({
    $or: [{ phoneNumber: userInfo.phoneNumber }, { email: userInfo.email }],
  });

  if (isExist.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A user already registered with this email or number"
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

const geUserProfileFromDB = async (id: Types.ObjectId) => {
  const fields = [
    "fullName",
    "emergencyContact",
    "profilePicture",
    "NIDNo",
    "birthCertificateNo",
    "dateOfBirth",
    "joiningDate",
  ];
  const addFieldsStage = fields.reduce((acc, field) => {
    return { ...acc, ...createSwitchField(field) };
  }, {});

  const result = (
    await User.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $lookup: {
          from: "admins",
          localField: "admin",
          foreignField: "_id",
          as: "admin",
        },
      },
      {
        $lookup: {
          from: "staffs",
          localField: "staff",
          foreignField: "_id",
          as: "staff",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "permissions",
          localField: "permissions",
          foreignField: "_id",
          as: "permissionsData",
        },
      },
      {
        $lookup: {
          from: "addresses",
          localField: "address",
          foreignField: "_id",
          as: "addressData",
        },
      },
      {
        $addFields: {
          ...addFieldsStage,
          permissions: "$permissionsData.name",
          address: {
            $arrayElemAt: ["$addressData.fullAddress", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          role: 1,
          phoneNumber: 1,
          email: 1,
          status: 1,
          fullName: 1,
          emergencyContact: 1,
          profilePicture: 1,
          NIDNo: 1,
          birthCertificateNo: 1,
          dateOfBirth: 1,
          joiningDate: 1,
          permissions: 1,
          address: 1,
        },
      },
    ])
  )[0];
  return result;
};

export const UserServices = {
  getAllAdminAndStaffFromDB,
  createCustomerIntoDB,
  createAdminOrStaffIntoDB,
  geUserProfileFromDB,
};
