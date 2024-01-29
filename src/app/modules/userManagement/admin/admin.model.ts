import { Schema, model } from "mongoose";
import { TAdmin } from "./admin.interface";

const AdminSchema = new Schema<TAdmin>(
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
    emergencyContact: {
      type: String,
      required: true,
    },
    NIDNo: {
      type: String,
    },
    birthCertificateNo: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    joiningDate: {
      type: String,
    },
    profilePicture: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Admin = model<TAdmin>("Admin", AdminSchema);
