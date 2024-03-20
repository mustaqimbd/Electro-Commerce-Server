import mongoose, { Document } from "mongoose";
import { TSelectedAttributes } from "../../../types/attribute";
import { TProduct } from "../../productManagement/product/product.interface";

export type TProductDetails = {
  product: mongoose.Types.ObjectId | TProduct;
  attributes: TSelectedAttributes[];
  unitPrice: number;
  quantity: number;
  total: number;
} & Document;

export type TOrderedProductsData = {
  orderId: string;
  productDetails: TProductDetails[];
};

export type TOrderedProducts = TOrderedProductsData & Document;
