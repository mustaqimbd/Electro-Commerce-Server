import { Document } from "mongoose";
import { TAddressData } from "../../../types/address";

export type TShippingData = {
  fullName: string;
  phoneNumber: string;
} & TAddressData;

export type TShipping = TShippingData & Document;
