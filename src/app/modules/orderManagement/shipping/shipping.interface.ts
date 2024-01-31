import { Document } from "mongoose";
import { TAddressData } from "../../../types/address";

export type TShippingData = TAddressData;

export type TShipping = TAddressData | Document;
