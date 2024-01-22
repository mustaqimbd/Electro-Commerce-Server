import { Document } from "mongoose";
import { IUserCommon } from "../../../types/users";

export type ICustomers = IUserCommon & Document;
