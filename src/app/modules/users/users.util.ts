import { Users } from "./users.model";

const findLastCustomer = async (): Promise<string | undefined> => {
  const lastCustomer = await Users.findOne(
    { role: "customer" },
    { _id: 1, id: 1 }
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
