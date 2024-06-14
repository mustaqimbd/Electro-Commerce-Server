import { TPermission } from "../modules/userManagement/permission/permission.interface";

const isPermitted = (
  permissions?: string[],
  requiredPermission?: TPermission
) => {
  const neededPermission = requiredPermission
    ? requiredPermission
    : "super admin";
  if (permissions?.length) {
    return (
      permissions &&
      (permissions.includes("super admin") ||
        permissions.includes(neededPermission as string))
    );
  }
  return false;
};

export default isPermitted;
