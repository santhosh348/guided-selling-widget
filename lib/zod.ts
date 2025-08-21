import { z } from "zod";

export const ProductSchema = z.object({
  title: z.string(),
  sku: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  specs: z.record(z.any()).optional(),
});

export const FAQSchema = z.object({
  q: z.string(),
  a: z.string()
});

export const AskSchema = z.object({
  question: z.string().min(2),
  product: ProductSchema,
  faqs: z.array(FAQSchema).max(10).optional(),
  enableWebSearch: z.boolean().optional()
});
