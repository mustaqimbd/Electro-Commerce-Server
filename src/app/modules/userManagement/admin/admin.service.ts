import { TJwtPayload } from "../../authManagement/auth/auth.interface";
import { TAdmin } from "./admin.interface";
import { Admin } from "./admin.model";

const updateAdminIntoDB = async (
  user: TJwtPayload,
  payload: TAdmin
): Promise<TAdmin | null> => {
  const result = await Admin.findOneAndUpdate({ uid: user.uid }, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

export const AdminServices = { updateAdminIntoDB };
