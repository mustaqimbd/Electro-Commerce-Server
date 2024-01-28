import { z } from "zod";
import { priceValidationSchema } from "../price/price.validation";
import { productImageValidationSchema } from "../productImage/productImage.validation";
import { inventoryValidationSchema } from "../inventory/inventory.validation";
// import { brandValidationSchema } from '../brand/brand.validation';
// import categoryValidationSchema from '../category/category.validation';
// import tagValidationSchema from '../tag/tag.validation';
import { seoDataValidationSchema } from "../seoData/seoData.validation";

const productAttributeValidationSchema = z.object({
  _id: z.string().min(1, { message: "Attribute Id is required!" }).optional(),
  name: z.string().min(1, { message: "Attribute name is required!" }),
  values: z.array(
    z.string().min(1, { message: "Attribute value is required!" })
  ),
});

export const productValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: "Title is required!" }),
    permalink: z.string().optional(),
    type: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().min(1, { message: "Description is required!" }),
    shortDescription: z.string().optional(),
    downloadable: z.boolean().optional(),
    featured: z.boolean().optional(),
    price: priceValidationSchema,
    image: productImageValidationSchema,
    inventory: inventoryValidationSchema,
    attribute: z.array(productAttributeValidationSchema),
    shipping: z.object({
      shippingConfiguration: z
        .string()
        .min(1, { message: "shipping configuration is required!" }),
    }),
    brand: z.array(z.string()).optional(),
    category: z.array(z.string().min(1, { message: "Category is required!" })),
    tag: z.array(z.string()).optional(),
    seoData: seoDataValidationSchema,
    publishedStatus: z.object({
      status: z.string().min(1, { message: "Status is required!" }),
      visibility: z.string().min(1, { message: "visibility is required!" }),
      date: z.string().min(1, { message: "Date is required!" }),
    }),
  }),
});
