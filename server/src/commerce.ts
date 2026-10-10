import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { db, transaction } from "./db.js";
import { HttpError } from "./http.js";
import { cartSchema, customerSchema } from "./validation.js";
import { z } from "zod";
import { orderEmail, lowStockEmail } from "./mail.js";
type DB = Prisma.TransactionClient;
export const productInclude = {
  category: true,
  images: { orderBy: { displayOrder: "asc" as const } },
  variants: { orderBy: { price: "asc" as const } },
};
export const mills = (v: any) => Math.round(Number(v) * 1000);
export const dinars = (n: number) => n / 1000;
export const discountAmount = (amount: number, type: string, value: any) =>
  Math.min(
    amount,
    Math.max(
      0,
      type === "PERCENTAGE"
        ? Math.round((amount * Number(value)) / 100)
        : mills(value),
    ),
  );
export async function activePromotions(tx: DB = db) {
  const now = new Date();
  return tx.promotion.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: {
      products: { select: { id: true } },
      categories: { select: { id: true } },
    },
  });
}
export function priceFor(product: any, variant: any, promotions: any[]) {
  const base = mills(variant?.price ?? product.price);
  let discount = 0;
  let promotionName: null | string = null;
  for (const p of promotions) {
    if (
      p.global ||
      p.products.some((x: any) => x.id === product.id) ||
      p.categories.some((x: any) => x.id === product.categoryId)
    ) {
      const d = discountAmount(base, p.type, p.value);
      if (d > discount) {
        discount = d;
        promotionName = p.name;
      }
    }
  }
  return {
    regularPrice: dinars(base),
    currentPrice: dinars(base - discount),
    promotionName,
  };
}
export function publicProduct(p: any, promotions: any[]) {
  const variants = p.variants
    .filter((v: any) => v.active)
    .map((v: any) => ({ ...v, ...priceFor(p, v, promotions) }));
  return { ...p, ...priceFor(p, variants[0], promotions), variants };
}
export async function calculate(
  input: z.infer<typeof cartSchema>,
  tx: DB = db,
) {
  const combined = new Map<
    string,
    z.infer<typeof cartSchema>["items"][number]
  >();
  for (const i of input.items) {
    const k = `${i.productId}:${i.variantId || ""}`;
    const prior = combined.get(k);
    combined.set(k, { ...i, quantity: (prior?.quantity || 0) + i.quantity });
  }
  const promotions = await activePromotions(tx);
  const items = [];
  let subtotal = 0;
  let promotionDiscount = 0;
  for (const i of combined.values()) {
    const p = await tx.product.findUnique({
      where: { id: i.productId },
      include: productInclude,
    });
    if (!p || !p.active || !p.category.active)
      throw new HttpError(409, "Un produit du panier n’est plus disponible.");
    const variants = p.variants.filter((v) => v.active);
    const v = i.variantId
      ? p.variants.find((v) => v.id === i.variantId && v.active)
      : null;
    if ((i.variantId && !v) || (variants.length && !v))
      throw new HttpError(422, `Sélectionnez une variante pour ${p.name}.`);
    const min = v?.minimumQuantity ?? p.minimumQuantity;
    if (i.quantity < min || i.quantity > 1000000)
      throw new HttpError(422, `${p.name} : quantité minimum ${min}.`);
    if (p.trackStock && i.quantity > (v?.stock ?? p.stock))
      throw new HttpError(409, `Stock insuffisant pour ${p.name}.`);
    const price = priceFor(p, v, promotions);
    const base = mills(price.regularPrice);
    const current = mills(price.currentPrice);
    subtotal += base * i.quantity;
    promotionDiscount += (base - current) * i.quantity;
    if (!Number.isSafeInteger(subtotal) || subtotal > 999999999999)
      throw new HttpError(
        422,
        "Le montant dépasse la limite de commande en ligne. Contactez-nous pour un devis.",
      );
    items.push({
      productId: p.id,
      variantId: v?.id ?? null,
      productName: p.name,
      variantName: v?.name ?? null,
      sku: v?.sku ?? p.sku,
      image: p.images[0]?.url ?? null,
      characteristics: v
        ? {
            dimensions: v.dimensions,
            size: v.size,
            color: v.color,
            material: v.material,
          }
        : p.specifications,
      quantity: i.quantity,
      orderUnit: p.orderUnit,
      quantityPerLot: v?.quantityPerLot ?? p.quantityPerLot,
      regularPrice: price.regularPrice,
      unitPrice: price.currentPrice,
      total: dinars(current * i.quantity),
      minimumQuantity: min,
      stock: v?.stock ?? p.stock,
      trackStock: p.trackStock,
      promotionName: price.promotionName,
    });
  }
  let couponDiscount = 0;
  let coupon = null;
  const net = subtotal - promotionDiscount;
  if (input.couponCode) {
    coupon = await tx.coupon.findUnique({
      where: { code: input.couponCode.trim().toUpperCase() },
    });
    const now = new Date();
    if (
      !coupon ||
      !coupon.active ||
      coupon.startsAt > now ||
      coupon.endsAt < now
    )
      throw new HttpError(422, "Ce coupon est invalide, désactivé ou expiré.");
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
      throw new HttpError(422, "Ce coupon a atteint sa limite d’utilisation.");
    if (net < mills(coupon.minimumOrder))
      throw new HttpError(
        422,
        `Minimum de commande : ${coupon.minimumOrder} TND.`,
      );
    if (coupon.perCustomerLimit) {
      if (!input.email)
        throw new HttpError(
          422,
          "Saisissez votre email pour vérifier ce coupon.",
        );
      const count = await tx.order.count({
        where: {
          couponId: coupon.id,
          email: input.email.toLowerCase(),
          status: { not: "CANCELLED" },
        },
      });
      if (count >= coupon.perCustomerLimit)
        throw new HttpError(
          422,
          "Limite d’utilisation de ce coupon atteinte pour cet email.",
        );
    }
    couponDiscount = discountAmount(net, coupon.type, coupon.value);
  }
  return {
    items,
    subtotal: dinars(subtotal),
    promotionDiscount: dinars(promotionDiscount),
    couponDiscount: dinars(couponDiscount),
    total: dinars(net - couponDiscount),
    couponCode: coupon?.code ?? null,
    couponId: coupon?.id ?? null,
  };
}
export async function placeOrder(
  cartId: string,
  customer: z.infer<typeof customerSchema>,
  idempotencyKey: string,
  userId?: string,
) {
  return transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { idempotencyKey },
      include: { items: true, history: true },
    });
    if (existing) {
      if (existing.email !== customer.email)
        throw new HttpError(409, "Clé de commande déjà utilisée.");
      return existing;
    }
    const cart = await tx.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new HttpError(422, "Votre panier est vide.");
    const input = cartSchema.parse({
      items: cart.items,
      couponCode: cart.couponCode,
      email: customer.email,
    });
    if (!input.items.length) throw new HttpError(422, "Votre panier est vide.");
    const totals = await calculate(input, tx);
    let c = await tx.customer.findUnique({ where: { email: customer.email } });
    if (!c)
      c = await tx.customer.create({
        data: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          ...(userId ? { userId } : {}),
          addresses: {
            create: { street: customer.address, city: customer.city },
          },
        },
      });
    const { items, ...amounts } = totals;
    const order = await tx.order.create({
      data: {
        ...customer,
        ...amounts,
        number: `pending-${randomUUID()}`,
        idempotencyKey,
        customerId: c.id,
        items: {
          create: items.map(
            ({ minimumQuantity, stock, trackStock, promotionName, ...i }) => ({
              ...i,
              characteristics: i.characteristics as Prisma.InputJsonValue,
            }),
          ),
        },
        history: {
          create: { status: "NEW", actor: "Client", note: "Commande reçue" },
        },
      },
    });
    for (const i of items) {
      if (!i.trackStock) continue;
      if (i.variantId) {
        const changed = await tx.productVariant.updateMany({
          where: { id: i.variantId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (changed.count !== 1)
          throw new HttpError(409, "Stock modifié. Vérifiez votre panier.");
      } else {
        const changed = await tx.product.updateMany({
          where: { id: i.productId, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (changed.count !== 1)
          throw new HttpError(409, "Stock modifié. Vérifiez votre panier.");
      }
      await tx.inventoryMovement.create({
        data: {
          productId: i.productId,
          variantId: i.variantId,
          quantity: -i.quantity,
          reason: `Commande ${order.id}`,
        },
      });
    }
    if (totals.couponId)
      await tx.coupon.update({
        where: { id: totals.couponId },
        data: { usageCount: { increment: 1 } },
      });
    await tx.cart.update({
      where: { id: cartId },
      data: { items: [], couponCode: "" },
    });
    const completed = await tx.order.update({
      where: { id: order.id },
      data: {
        number: `INDB-${new Date().getFullYear()}-${String(order.sequence).padStart(6, "0")}`,
      },
      include: { items: true, history: true },
    });
    await orderEmail(tx, completed, "ORDER_CREATED");
    for (const i of items)
      if (i.trackStock)
        await lowStockEmail(
          tx,
          { ...i, stock: i.stock - i.quantity },
          i.stock,
          `${completed.id}:${i.variantId || i.productId}`,
          completed.number,
        );
    return completed;
  });
}
export const transitions: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
