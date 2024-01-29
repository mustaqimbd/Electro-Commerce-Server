import { TPermission, TPermissionData } from "./permission.interface";
import { Permission } from "./permission.model";

const createPermissionIntoDB = async (
  payload: TPermissionData
): Promise<TPermission> => {
  const result = await Permission.create(payload);
  return result;
};

export const PermissionServices = {
  createPermissionIntoDB,
};
