import mongoose from "mongoose";
import config from "../config/config";
import { Address } from "../modules/userManagement/address/address.model";
import { Admin } from "../modules/userManagement/admin/admin.model";
import { permissionEnums } from "../modules/userManagement/permission/permission.const";
import { Permission } from "../modules/userManagement/permission/permission.model";
import { User } from "../modules/userManagement/user/user.model";
import { createAdminOrStaffId } from "../modules/userManagement/user/user.util";
import { consoleLogger } from "./logger";

const checkPermission = async (session: mongoose.mongo.ClientSession) => {
  const existingPermission = await Permission.findOne({ name: "super admin" });
  if (existingPermission) return existingPermission;

  // If not found, create the permissions
  const createdPermissions = await Permission.create(
    permissionEnums.map((item) => ({ name: item })),
    { session }
  );

  // Find the specific "super admin" permission
  const superAdminPermission = createdPermissions.find(
    (item) => item.name === "super admin"
  );

  return superAdminPermission;
};

const createSuperAdmin = async () => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start transaction right away

  try {
    const userId = await createAdminOrStaffId(false);
    if (!userId) {
      consoleLogger.error("Failed to create user ID!");
      return;
    }

    const superAdminPermission = await checkPermission(session);
    if (!superAdminPermission) {
      consoleLogger.error("Failed to create permissions!");
      return;
    }

    const adminData = {
      uid: userId,
      fullName: config.fullName,
      // emergencyContact: "01912345678",
      // NIDNo: "1234567890123",
      // birthCertificateNo: "9876543210",
      // dateOfBirth: "1990-01-01",
      // joiningDate: "2023-09-18",
      // profilePicture: "https://example.com/profile.jpg",
    };

    const [admin] = await Admin.create([adminData], { session });
    if (!admin) {
      consoleLogger.error("Failed to create admin!");
      return;
    }

    const addressData = {
      uid: userId,
      fullAddress: config.fullAddress,
    };

    const [address] = await Address.create([addressData], { session });
    if (!address) {
      consoleLogger.error("Failed to create address!");
      return;
    }

    const superAdminData = {
      uid: userId,
      phoneNumber: config.phoneNumber,
      email: config.email,
      password: config.password,
      role: "admin",
      admin: admin._id,
      address: address._id,
      permissions: [superAdminPermission._id],
      status: "active",
    };

    await User.create([superAdminData], { session });

    await session.commitTransaction();
    consoleLogger.info("Super admin created successfully.");
  } catch (error) {
    await session.abortTransaction();
    consoleLogger.error(
      "Transaction failed. Super admin creation aborted!",
      error
    );
    throw error;
  } finally {
    session.endSession();
  }
};

const seedSuperAdmin = async () => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "admin" });
    if (!existingSuperAdmin) {
      await createSuperAdmin();
    } else {
      consoleLogger.info("Super admin already exists.");
    }
  } catch (error) {
    consoleLogger.error("Error while seeding super admin!", error);
  }
};

export default seedSuperAdmin;
