import { Document } from "mongoose";
import { TUserCommon } from "../../types/user.types";

export type TCustomer = TUserCommon & Document;
