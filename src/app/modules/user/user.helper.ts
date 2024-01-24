import httpStatus from "http-status";
import { ClientSession, Model } from "mongoose";
import ApiError from "../../errors/ApiError";
import { TAdmin } from "../admin/admin.interface";
import { IStaffs } from "../staff/staff.interface";
import { TUser } from "./user.interface";
import { Users } from "./user.model";
import { createAdminOrStaffId } from "./user.util";

const createAdminOrStaffUser = async (
  role: "admin" | "staff",
  isStaff: boolean,
  modelName: Model<TAdmin | IStaffs>,
  userInfo: TUser,
  personalInfo: TAdmin | IStaffs,
  session: ClientSession
): Promise<TUser> => {
  const id = await createAdminOrStaffId(isStaff);
  userInfo.id = id;
  personalInfo.uid = id;
  const [createdModel] = await modelName.create([personalInfo], { session });
  if (!createdModel) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create the ${userInfo.role}`
    );
  }
  userInfo[role] = createdModel._id;
  const [user] = await Users.create([userInfo], { session });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to create the user`);
  }

  return user;
};

export const UserHelper = {
  createAdminOrStaffUser,
};
