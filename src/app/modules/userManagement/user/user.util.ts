import { User } from "./user.model";

const findLastCustomer = async (): Promise<string | undefined> => {
  const lastCustomer = await User.findOne({ role: "customer" }, { uid: 1 })
    .sort({
      createdAt: -1,
    })
    .lean();
  return lastCustomer?._id ? lastCustomer?.uid.substring(3) : undefined;
};

export const createCustomerId = async (): Promise<string> => {
  const currentId = (await findLastCustomer()) || "0";
  const incrementedId = (parseInt(currentId) + 1).toString().padStart(7, "0");
  const date = new Date();
  const newId = `C${date.getFullYear().toString().substring(2)}${incrementedId}`;
  return newId;
};

export const createAdminOrStaffId = async (isStaff: boolean) => {
  let lastId = undefined;
  if (isStaff) {
    const lastStaff = await User.findOne({ role: "staff" }, { uid: 1 })
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastStaff?._id ? lastStaff.uid.substring(3) : undefined;
  } else {
    const lastAdmin = await User.findOne({ role: "admin" }, { uid: 1 })
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastAdmin?._id ? lastAdmin.uid.substring(3) : undefined;
  }
  const currentId = lastId || "0";
  const incrementedId = (parseInt(currentId) + 1).toString().padStart(3, "0");
  const date = new Date();
  const newId = `${isStaff ? "S" : "A"}${date.getFullYear().toString().substring(2)}${incrementedId}`;
  return newId;
};
