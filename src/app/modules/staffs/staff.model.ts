import { Schema, model } from "mongoose";
import { IStaffs } from "./staff.interface";

const StaffSchema = new Schema<IStaffs>({
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

export const Staffs = model<IStaffs>("Staffs", StaffSchema);
