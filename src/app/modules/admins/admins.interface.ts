import { Document } from "mongoose";
import { IUserCommon } from "../../../types/users";

export type IAdmins = { profilePicture: string } & IUserCommon & Document;
