import { Document } from "mongoose";
import { TUserCommon } from "../../types/users";

export type IStaffs = { profilePicture: string } & TUserCommon & Document;
