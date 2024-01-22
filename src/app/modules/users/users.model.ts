import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import config from "../../../config";
import { rolesEnums } from "./users.const";
import { IUser } from "./users.interface";

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: rolesEnums,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: String,
    password: {
      type: String,
      required: true,
      select: 0,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customers",
    },
    staff: {
      type: Schema.Types.ObjectId,
    },
    admin: {
      type: Schema.Types.ObjectId,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      set: () => false,
    },
    status: {
      type: Boolean,
      default: true,
      set: () => true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round),
  );
  next();
});

export const Users = model<IUser>("Users", UserSchema);
