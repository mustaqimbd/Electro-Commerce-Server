import mongoose, { Document } from "mongoose";

export type TAddressData = {
  userId?: string;
  sessionId?: string;
  fullAddress: string;
  city?: mongoose.Types.ObjectId;
  state?: mongoose.Types.ObjectId;
  country?: mongoose.Types.ObjectId;
  zip_code?: mongoose.Types.ObjectId;
};

export type TAddress = TAddressData & Document;
