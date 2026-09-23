import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db.js";
import { productInclude, activePromotions, publicProduct } from "./commerce.js";

// Filtering, sorting and pagination remain in PostgreSQL, including scheduled prices.
// All user values are bound parameters; only fixed sort expressions are interpolated.
export async function catalogue(
  query: Record<string, unknown>,
  limit: number,
  skip: number,
) {
  const f = z
    .object({
      q: z.string().max(200).default(""),
      category: z.string().max(160).default(""),
      min: z.coerce.number().finite().min(0).optional(),
      max: z.coerce.number().finite().min(0).optional(),
      sort: z.enum(["", "price-asc", "price-desc", "name"]).default(""),
      featured: z.enum(["true", "false"]).optional(),
      new: z.enum(["true", "false"]).optional(),
    })
    .parse(query);
  const pattern = "%" + f.q.replace(/[\\%_]/g, "\\$&") + "%";
  const sort =
    f.sort === "price-asc"
      ? Prisma.sql`effective ASC, id ASC`
      : f.sort === "price-desc"
        ? Prisma.sql`effective DESC, id ASC`
        : f.sort === "name"
          ? Prisma.sql`name ASC, id ASC`
          : Prisma.sql`"createdAt" DESC, id ASC`;
  const [result] = await db.$queryRaw<
    Array<{ ids: string[]; total: bigint }>
  >(Prisma.sql`
 WITH candidates AS (
 SELECT p.id,p.name,p."createdAt",p."categoryId",COALESCE(v.price,p.price) AS base
 FROM "Product" p JOIN "Category" c ON c.id=p."categoryId"
 LEFT JOIN LATERAL (SELECT price FROM "ProductVariant" WHERE "productId"=p.id AND active=true ORDER BY price ASC LIMIT 1) v ON true
 WHERE p.active=true AND c.active=true
 AND (${f.category}='' OR c.slug=${f.category})
 AND (${f.featured === "true"}=false OR p.featured=true)
 AND (${f.new === "true"}=false OR p."isNew"=true)
 AND (${f.q}='' OR p.name ILIKE ${pattern} OR p.description ILIKE ${pattern} OR p."shortDescription" ILIKE ${pattern} OR p.sku ILIKE ${pattern} OR c.name ILIKE ${pattern}
 OR EXISTS (SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE ${pattern})
 OR EXISTS (SELECT 1 FROM "ProductVariant" sv WHERE sv."productId"=p.id AND sv.active=true AND (sv.sku ILIKE ${pattern} OR sv.name ILIKE ${pattern})))
 ), priced AS (
 SELECT c.*,c.base-COALESCE((SELECT MAX(LEAST(c.base,CASE WHEN promo.type='PERCENTAGE' THEN round(c.base*promo.value/100,3) ELSE promo.value END))
 FROM "Promotion" promo WHERE promo.active=true AND promo."startsAt"<=NOW() AND promo."endsAt">=NOW()
 AND (promo.global=true OR EXISTS (SELECT 1 FROM "_PromotionProducts" pp WHERE pp."A"=c.id AND pp."B"=promo.id) OR EXISTS (SELECT 1 FROM "_PromotionCategories" pc WHERE pc."A"=c."categoryId" AND pc."B"=promo.id))),0) AS effective FROM candidates c
 ), filtered AS (SELECT * FROM priced WHERE (${f.min ?? null}::numeric IS NULL OR effective>=${f.min ?? null}) AND (${f.max ?? null}::numeric IS NULL OR effective<=${f.max ?? null}))
 SELECT ARRAY(SELECT id FROM filtered ORDER BY ${sort} LIMIT ${limit} OFFSET ${skip}) AS ids,(SELECT COUNT(*) FROM filtered) AS total`);
  const [products, promotions] = await Promise.all([
    db.product.findMany({
      where: { id: { in: result.ids } },
      include: productInclude,
    }),
    activePromotions(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  return {
    rows: result.ids.map((id) => publicProduct(byId.get(id), promotions)),
    total: Number(result.total),
  };
}
