import { Document } from "mongoose";
import { TUserCommon } from "../../types/users";

export type TAdmin = { profilePicture: string } & TUserCommon & Document;
