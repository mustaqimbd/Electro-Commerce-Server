import { Schema, model } from "mongoose";
import { IAdmins } from "./admins.interface";

const StaffSchema = new Schema<IAdmins>({
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

export const Stuffs = model<IAdmins>("Staffs", StaffSchema);
