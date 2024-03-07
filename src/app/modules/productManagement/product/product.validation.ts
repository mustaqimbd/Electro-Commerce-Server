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
  _id: z.string().min(1, { message: "Attribute Id is required!" }).optional(),
  name: z
    .string()
    .min(1, { message: "Attribute name is required!" })
    .optional(),
  values: z
    .array(z.string().min(1, { message: "Attribute value is required!" }))
    .optional(),
});
const category = z.object({
  _id: z.string().min(1, { message: "Category is required!" }),
  subCategory: z
    .array(z.string().min(1, { message: "Sub category is required!" }))
    .optional(),
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
    review: z.boolean().optional(),
    price: PriceValidation.price,
    image: ProductImageValidation.productImage,
    inventory: InventoryValidation.inventory,
    attribute: z.array(updateProductAttribute).optional(),
    brand: z.array(z.string()).optional(),
    category: category,
    tag: z.array(z.string()).optional(),
    seoData: SeoDataValidation.updatesSeoData.optional(),
    publishedStatus: z.object({
      status: z.enum([...publishedStatus] as [string, ...string[]]),
      visibility: z.enum([...visibilityStatus] as [string, ...string[]]),
      date: z.string().min(1, { message: "Date is required!" }),
    }),
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
    inventory: InventoryValidation.updateInventory.optional(),
    attribute: z.array(updateProductAttribute).optional(),
    brand: z.array(z.string()).optional(),
    category: category.optional(),
    tag: z.array(z.string()).optional(),
    seoData: SeoDataValidation.updatesSeoData.optional(),
    publishedStatus: z
      .object({
        status: z
          .enum([...publishedStatus] as [string, ...string[]])
          .optional(),
        visibility: z
          .enum([...visibilityStatus] as [string, ...string[]])
          .optional(),
        date: z.string().min(1, { message: "Date is required!" }).optional(),
      })
      .optional(),
  }),
});

export const ProductValidation = {
  product,
  updateProduct,
};
