import mongoose, { Document } from "mongoose";
import { TImage } from "../image/image.interface";

export type TCourierCredentials = [string, string];

export type TCourierData = {
  name: string;
  slug: string;
  image: mongoose.Types.ObjectId | TImage;
  website?: string;
  credentials: TCourierCredentials[];
  isActive: boolean;
};

export type TCourier = TCourierData & Document;
