import { Types } from "mongoose";

export type TImage = {
  src: string;
  alt: string;
  uploadedBy: Types.ObjectId;
  isDeleted?: boolean;
};
