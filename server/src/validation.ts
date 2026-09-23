import { z } from "zod";
const text = z.string().max(10000);
const short = z.string().trim().max(240);
const money = z.coerce.number().finite().min(0).max(10000000);
const integer = z.coerce.number().int().min(0).max(1000000);
const positive = integer.min(1);
const slug = z
  .string()
  .min(2)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug : lettres minuscules, chiffres et tirets.",
  );
export const imagePath = z
  .string()
  .regex(/^\/(assets|uploads)\/[a-zA-Z0-9_./-]+$/)
  .refine((v) => !v.includes(".."), "Chemin invalide");
export const categorySchema = z.object({
  name: short.min(2),
  slug,
  description: text.default(""),
  image: imagePath.nullable().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  displayOrder: integer.default(0),
  seoTitle: short.default(""),
  seoDescription: short.default(""),
  parentId: z.string().nullable().optional(),
});
export const variantSchema = z.object({
  id: z.string().optional(),
  name: short.min(1),
  sku: short.min(1),
  price: money,
  compareAtPrice: money.nullable().optional(),
  stock: integer.default(0),
  size: short.default(""),
  dimensions: short.default(""),
  color: short.default(""),
  material: short.default(""),
  minimumQuantity: positive.default(1),
  quantityPerLot: positive.default(1),
  active: z.boolean().default(true),
});
export const productSchema = z
  .object({
    name: short.min(2),
    slug,
    sku: short.min(1),
    shortDescription: text.default(""),
    description: text.default(""),
    categoryId: z.string().min(1),
    price: money,
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    trackStock: z.boolean().default(true),
    stock: integer.default(0),
    minimumQuantity: positive.default(1),
    orderUnit: z.enum(["UNIT", "LOT"]).default("UNIT"),
    quantityPerLot: positive.default(1),
    seoTitle: short.default(""),
    seoDescription: short.default(""),
    specifications: z.record(short, short).default({}),
    tags: z.array(short).max(30).default([]),
    images: z
      .array(z.object({ url: imagePath, alt: short.default("") }))
      .max(15)
      .default([]),
    variants: z.array(variantSchema).max(100).default([]),
    relatedIds: z.array(z.string()).max(20).default([]),
  })
  .refine(
    (v) => new Set(v.variants.map((x) => x.sku)).size === v.variants.length,
    "Chaque variante doit avoir un SKU unique.",
  );
const discount = z.object({
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: money,
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  active: z.boolean().default(true),
});
const validDiscount = (b: {
  type: string;
  value: number;
  startsAt: Date;
  endsAt: Date;
}) => b.endsAt > b.startsAt && (b.type !== "PERCENTAGE" || b.value <= 100);
export const couponSchema = discount
  .extend({
    code: short.min(2).transform((s) => s.trim().toUpperCase()),
    minimumOrder: money.default(0),
    usageLimit: positive.nullable().optional(),
    perCustomerLimit: positive.nullable().optional(),
  })
  .refine(validDiscount, "Vérifiez les dates et le pourcentage (0–100).");
export const promotionSchema = discount
  .extend({
    name: short.min(2),
    global: z.boolean().default(false),
    productIds: z.array(z.string()).default([]),
    categoryIds: z.array(z.string()).default([]),
  })
  .refine(validDiscount, "Vérifiez les dates et le pourcentage (0–100).")
  .refine(
    (b) => b.global || b.productIds.length > 0 || b.categoryIds.length > 0,
    "Choisissez au moins une cible.",
  );
export const serviceSchema = z.object({
  title: short.min(2),
  description: text.min(2),
  image: imagePath.nullable().optional(),
  icon: short.default("Package"),
  displayOrder: integer.default(0),
  active: z.boolean().default(true),
});
export const customerSchema = z.object({
  firstName: short.min(1),
  lastName: short.min(1),
  company: short.optional(),
  phone: z.string().min(6).max(30),
  email: z
    .string()
    .email()
    .max(240)
    .transform((v) => v.toLowerCase()),
  address: short.min(4),
  city: short.min(2),
  notes: text.default(""),
});
export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: positive,
});
export const cartSchema = z.object({
  items: z.array(cartItemSchema).max(100),
  couponCode: short.default(""),
  email: z.string().email().optional(),
});
export const quoteSchema = z.object({
  name: short.min(2),
  company: short.optional(),
  phone: z.string().min(6).max(30),
  email: z.string().email(),
  desiredDeliveryDate: z.coerce.date().nullable().optional(),
  notes: text.default(""),
  files: z
    .array(z.string().regex(/^\/uploads\/quotes\/[a-f0-9-]+\.(pdf|webp)$/))
    .max(5)
    .default([]),
  items: z
    .array(
      z.object({
        productId: z.string().nullable().optional(),
        categoryId: z.string().nullable().optional(),
        packagingType: short.min(2),
        quantity: positive,
        dimensions: short.default(""),
        material: short.default(""),
        printing: short.default(""),
        colors: short.default(""),
      }),
    )
    .min(1)
    .max(20),
});
export const settingsSchema = z.object({
  phone: short,
  email: z.string().email(),
  address: short,
  instagram: z
    .string()
    .url()
    .regex(/^https?:\/\//)
    .or(z.literal("")),
  facebook: z
    .string()
    .url()
    .regex(/^https?:\/\//)
    .or(z.literal("")),
  heroTitle: short.min(3),
  heroSubtitle: text,
  heroCta: short,
  heroBackground: imagePath,
  companyDescription: text,
  footerText: short,
});
