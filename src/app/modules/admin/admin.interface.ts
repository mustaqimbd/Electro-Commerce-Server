import { Document } from "mongoose";
import { TUserCommon } from "../../types/user.types";

export type TAdmin = { profilePicture: string } & TUserCommon & Document;
