import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Schema, model } from "mongoose";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";
import { rolesEnums } from "./users.const";
import { IUser } from "./users.interface";

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: rolesEnums,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
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
  const isAlreadyExist = await Users.find({ phoneNumber: this.phoneNumber });
  if (isAlreadyExist.length) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An user is already exist with this phone number.",
    );
  }
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_round),
  );
  next();
});

export const Users = model<IUser>("Users", UserSchema);
