import { Schema, model } from "mongoose";
import { TStaff } from "./staff.interface";

const StaffSchema = new Schema<TStaff>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Staff = model<TStaff>("Staff", StaffSchema);
