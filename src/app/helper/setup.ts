// Create permissions

import mongoose, { Types } from "mongoose";
import { Admin } from "../modules/userManagement/admin/admin.model";
import { permissionEnums } from "../modules/userManagement/permission/permission.const";
import { Permission } from "../modules/userManagement/permission/permission.model";
import { UserHelpers } from "../modules/userManagement/user/user.helper";
import { createAdminOrStaffId } from "../modules/userManagement/user/user.util";
import { consoleLogger } from "../utilities/logger";

const checkPermission = async () => {
  const isExist = await Permission.find();

  if (isExist.length === permissionEnums.length)
    return isExist.find((item) => item.name === "super admin");

  consoleLogger.info("No permission found creating permissions");
  const createdPermissions = await Permission.create(
    permissionEnums.map((item) => ({ name: item }))
  );
  return createdPermissions.find((item) => item.name === "super admin");
};

// Create a default super admin
const createSuperAdmin = async ({
  permissionId,
}: {
  permissionId: Types.ObjectId;
}) => {
  const userId = await createAdminOrStaffId(false);
  const isExist = userId !== "A24001";
  if (isExist) return;
  consoleLogger.info("No admin found creating admin");
  const session = await mongoose.startSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userInfo: any = {
    phoneNumber: "01000000000",
    password: "Default#password",
    email: "default@user.co",
    permissions: [permissionId],
    role: "admin",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personalInfo: any = {
    fullName: "Default user",
    emergencyContact: "01000000002",
  };

  const address = {
    fullAddress: "Default user address",
  };

  try {
    session.startTransaction();
    await UserHelpers.createAdminOrStaffUser(
      "admin",
      Admin,
      userInfo,
      personalInfo,
      address,
      session
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const setUp = async () => {
  const superAdminPermission = await checkPermission();
  await createSuperAdmin({
    permissionId: new Types.ObjectId(superAdminPermission?._id),
  });
};
