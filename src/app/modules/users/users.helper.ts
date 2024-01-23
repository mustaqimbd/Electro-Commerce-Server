import httpStatus from "http-status";
import { ClientSession, Model } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { IAdmins } from "../admins/admins.interface";
import { IStaffs } from "../staffs/staff.interface";
import { IUser } from "./users.interface";
import { Users } from "./users.model";
import { createAdminOrStaffId } from "./users.util";

const createAdminOrStaffUser = async (
  role: "admin" | "staff",
  isStaff: boolean,
  modelName: Model<IAdmins | IStaffs>,
  userInfo: IUser,
  personalInfo: IAdmins | IStaffs,
  session: ClientSession,
): Promise<IUser> => {
  const id = await createAdminOrStaffId(isStaff);
  userInfo.id = id;
  personalInfo.uid = id;
  const [createdModel] = await modelName.create([personalInfo], { session });
  if (!createdModel) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Failed to create the ${userInfo.role}`,
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
