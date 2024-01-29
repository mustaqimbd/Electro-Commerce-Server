import { Document } from "mongoose";
import { TUserCommon } from "../../../types/user";

export type TStaff = { profilePicture: string } & TUserCommon & Document;
