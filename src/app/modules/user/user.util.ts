import { Users } from "./user.model";

const findLastCustomer = async (): Promise<string | undefined> => {
  const lastCustomer = await Users.findOne(
    { role: "customer" },
    { _id: 1, id: 1 },
  )
    .sort({
      createdAt: -1,
    })
    .lean();
  return lastCustomer?.id ? lastCustomer.id.substring(3) : undefined;
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
    const lastStaff = await Users.findOne({ role: "staff" }, { _id: 1, id: 1 })
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastStaff?._id ? lastStaff.id.substring(3) : undefined;
  } else {
    const lastAdmin = await Users.findOne({ role: "admin" }, { _id: 1, id: 1 })
      .sort({ createdAt: -1 })
      .lean();
    lastId = lastAdmin?._id ? lastAdmin.id.substring(3) : undefined;
  }
  const currentId = lastId || "0";
  const incrementedId = (parseInt(currentId) + 1).toString().padStart(3, "0");
  const date = new Date();
  const newId = `${isStaff ? "S" : "A"}${date.getFullYear().toString().substring(2)}${incrementedId}`;
  return newId;
};
