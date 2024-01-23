import { Schema, model } from "mongoose";
import { TStaff } from "./staff.interface";

const StaffSchema = new Schema<TStaff>({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  fullAddress: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    required: true,
  },
});

export const Staff = model<TStaff>("Staff", StaffSchema);
