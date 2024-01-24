import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import config from "../../config/config";
import { rolesEnum, statusEnum } from "./user.const";
import { TUser, TUserModel } from "./user.interface";

const UserSchema = new Schema<TUser, TUserModel>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: rolesEnum,
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
      ref: "Customer",
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    status: {
      type: String,
      enum: statusEnum,
      default: "active",
      set: () => "active",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

UserSchema.statics.isPasswordMatch = async function (
  givenPassWord,
  savedPassword
) {
  return await bcrypt.compare(givenPassWord, savedPassword);
};

UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round)
  );
  next();
});

export const User = model<TUser, TUserModel>("User", UserSchema);