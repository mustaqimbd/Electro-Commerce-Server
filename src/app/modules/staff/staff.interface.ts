import { Document } from "mongoose";
import { TUserCommon } from "../../types/user.types";

export type TStaff = { profilePicture: string } & TUserCommon & Document;
