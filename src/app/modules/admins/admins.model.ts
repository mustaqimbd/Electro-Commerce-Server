import { Schema, model } from "mongoose";
import { IAdmins } from "./admins.interface";

const AdminSchema = new Schema<IAdmins>({
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

export const Admins = model<IAdmins>("Admins", AdminSchema);
