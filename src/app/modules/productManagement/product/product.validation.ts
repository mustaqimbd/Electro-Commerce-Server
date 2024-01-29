import { z } from "zod";
import { PriceValidation } from "../price/price.validation";
import { ProductImageValidation } from "../productImage/productImage.validation";
import { InventoryValidation } from "../inventory/inventory.validation";
import { SeoDataValidation } from "../seoData/seoData.validation";
import { publishedStatus, visibilityStatus } from "./product.const";

const productAttribute = z.object({
  _id: z.string().min(1, { message: "Attribute Id is required!" }).optional(),
  name: z.string().min(1, { message: "Attribute name is required!" }),
  values: z.array(
    z.string().min(1, { message: "Attribute value is required!" })
  ),
});

const product = z.object({
  body: z.object({
    title: z.string().min(1, { message: "Title is required!" }),
    permalink: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().min(1, { message: "Description is required!" }),
    shortDescription: z.string().optional(),
    downloadable: z.boolean().optional(),
    featured: z.boolean().optional(),
    price: PriceValidation.price,
    image: ProductImageValidation.productImage,
    inventory: InventoryValidation.inventory,
    attribute: z.array(productAttribute),
    brand: z.array(z.string()).optional(),
    category: z.array(z.string().min(1, { message: "Category is required!" })),
    tag: z.array(z.string()).optional(),
    seoData: SeoDataValidation.seoData,
    publishedStatus: z.object({
      status: z.enum([...publishedStatus] as [string, ...string[]]),
      visibility: z.enum([...visibilityStatus] as [string, ...string[]]),
      date: z.string().min(1, { message: "Date is required!" }),
    }),
  }),
});

export const ProductValidation = {
  product,
};
