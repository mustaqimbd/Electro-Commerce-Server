import bcrypt from "bcrypt";
import { Schema, model } from "mongoose";
import config from "../../config";
import { rolesEnums } from "./user.const";
import { TUser, TUserModel } from "./user.interface";

const UserSchema = new Schema<TUser, TUserModel>(
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

export const Users = model<TUser, TUserModel>("User", UserSchema);
