import { Document } from "mongoose";
import { IUserCommon } from "../../../types/users";

export type IStaffs = { profilePicture: string } & IUserCommon & Document;
