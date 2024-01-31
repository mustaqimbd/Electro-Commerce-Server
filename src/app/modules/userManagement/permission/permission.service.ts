import { TPermission, TPermissionData } from "./permission.interface";
import { Permission } from "./permission.model";

const getAllPermissionsFromDB = async (): Promise<TPermission[]> => {
  const result = await Permission.find()
    .select({ name: 1 })
    .sort({ createdAt: -1 });
  return result;
};

const createPermissionIntoDB = async (
  payload: TPermissionData
): Promise<TPermission> => {
  const result = await Permission.create(payload);
  return result;
};

export const PermissionServices = {
  getAllPermissionsFromDB,
  createPermissionIntoDB,
};
