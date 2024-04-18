import { z } from "zod";
import { PriceValidation } from "../price/price.validation";
import { ProductImageValidation } from "../productImage/productImage.validation";
import { InventoryValidation } from "../inventory/inventory.validation";
import { SeoDataValidation } from "../seoData/seoData.validation";
import { publishedStatus, visibilityStatus } from "./product.const";

// const productAttribute = z.object({
//   _id: z.string().min(1, { message: "Attribute Id is required!" }).optional(),
//   name: z.string().min(1, { message: "Attribute name is required!" }),
//   values: z.array(
//     z.string().min(1, { message: "Attribute value is required!" })
//   ),
// });

const updateProductAttribute = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  values: z.array(z.string()).optional(),
});

const category = z.object({
  _id: z.string().min(1, { message: "Category is required!" }),
  subCategory: z.array(z.string()).optional(),
});

const warrantyInfo = z.object({
  duration: z.string().min(1, { message: "Duration is required!" }),
  terms: z.string().min(1, { message: "Duration is required!" }),
});

const publishedStatusSchema = z.object({
  status: z.enum([...publishedStatus] as [string, ...string[]]),
  visibility: z.enum([...visibilityStatus] as [string, ...string[]]),
  date: z.string().min(1, { message: "Date is required!" }),
});

const updatePublishedStatus = z
  .object({
    status: z.enum([...publishedStatus] as [string, ...string[]]).optional(),
    visibility: z
      .enum([...visibilityStatus] as [string, ...string[]])
      .optional(),
    date: z.string().min(1, { message: "Date is required!" }).optional(),
  })
  .optional();

const product = z.object({
  body: z.object({
    title: z.string().min(1, { message: "Title is required!" }),
    permalink: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    downloadable: z.boolean().optional(),
    featured: z.boolean().optional(),
    review: z.boolean().optional(),
    price: PriceValidation.price,
    image: ProductImageValidation.productImage,
    inventory: InventoryValidation.inventory,
    attribute: z.array(updateProductAttribute).optional(),
    brand: z.array(z.string()).optional(),
    category: category,
    warranty: z.boolean({ required_error: "warranty is required" }),
    warrantyInfo: warrantyInfo.optional(),
    tag: z.array(z.string()).optional(),
    seoData: SeoDataValidation.updatesSeoData.optional(),
    publishedStatus: publishedStatusSchema,
  }),
});

const updateProduct = z.object({
  body: z.object({
    title: z.string().min(1, { message: "Title is required!" }).optional(),
    permalink: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    description: z
      .string()
      .min(1, { message: "Description is required!" })
      .optional(),
    shortDescription: z.string().optional(),
    downloadable: z.boolean().optional(),
    featured: z.boolean().optional(),
    review: z.boolean().optional(),
    price: PriceValidation.updatePrice.optional(),
    image: ProductImageValidation.updateProductImage.optional(),
    inventory: InventoryValidation.inventory.optional(),
    attribute: z.array(updateProductAttribute).optional(),
    brand: z.array(z.string()).optional(),
    category: category.optional(),
    warranty: z.boolean().optional(),
    warrantyInfo: warrantyInfo.optional(),
    tag: z.array(z.string()).optional(),
    seoData: SeoDataValidation.updatesSeoData.optional(),
    publishedStatus: updatePublishedStatus,
  }),
});

export const ProductValidation = {
  product,
  updateProduct,
};
