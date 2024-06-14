import { Types } from "mongoose";
import { User } from "../user/user.model";
import { TPermission, TPermissionData } from "./permission.interface";
import { Permission } from "./permission.model";

const getAllPermissionsFromDB = async (): Promise<TPermission[]> => {
  const result = await Permission.find()
    .select({ __v: 0 })
    .sort({ createdAt: -1 });
  return result;
};

const createPermissionIntoDB = async (
  payload: TPermissionData[]
): Promise<TPermission[]> => {
  const data = payload.map((item) => ({ name: item }));
  const result = await Permission.create(data);
  return result;
};

const addPermissionToUserIntoDB = async (
  userId: Types.ObjectId,
  permissionIds: Types.ObjectId[]
) => {
  const result = await User.findByIdAndUpdate(
    userId,
    {
      permissions: permissionIds,
    },
    { new: true }
  );
  return result;
};

export const PermissionServices = {
  getAllPermissionsFromDB,
  createPermissionIntoDB,
  addPermissionToUserIntoDB,
};
