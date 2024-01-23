import { Document } from "mongoose";
import { TUserCommon } from "../../types/users";

export type TCustomer = TUserCommon & Document;
