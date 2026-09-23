import { Router } from "express";
import { randomUUID } from "node:crypto";
import { catalogue } from "./catalog.js";
import { z } from "zod";
import { db } from "./db.js";
import { cartId, requireRole, limited } from "./auth.js";
import { ok, HttpError, page } from "./http.js";
import {
  productInclude,
  activePromotions,
  publicProduct,
  calculate,
  placeOrder,
} from "./commerce.js";
import { cartSchema, customerSchema, quoteSchema } from "./validation.js";
import { quoteEmail, contactEmail } from "./mail.js";
export const publicApi = Router();
publicApi.get("/settings", async (_req, res) => {
  const settings = await db.siteSetting.findUnique({ where: { key: "site" } });
  ok(res, settings?.value ?? {});
});
publicApi.get("/categories", async (_req, res) =>
  ok(
    res,
    await db.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    }),
  ),
);
publicApi.get("/services", async (_req, res) =>
  ok(
    res,
    await db.service.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
    }),
  ),
);
publicApi.get("/products", async (req, res) => {
  const { page: p, limit, skip } = page(req.query);
  const { rows, total } = await catalogue(req.query, limit, skip);
  ok(res, rows, 200, {
    page: p,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});
publicApi.get("/products/:slug", async (req, res) => {
  const p = await db.product.findUnique({
    where: { slug: String(req.params.slug) },
    include: {
      ...productInclude,
      related: {
        where: { active: true, category: { active: true } },
        include: productInclude,
      },
    },
  });
  if (!p || !p.active || !p.category.active)
    throw new HttpError(404, "Produit introuvable.");
  const promotions = await activePromotions();
  const related = p.related.length
    ? p.related
    : await db.product.findMany({
        where: { categoryId: p.categoryId, id: { not: p.id }, active: true },
        include: productInclude,
        take: 4,
      });
  ok(res, {
    ...publicProduct(p, promotions),
    related: related.map((p) => publicProduct(p, promotions)),
  });
});
publicApi.get("/cart", async (req, res) => {
  const id = cartId(req, res);
  const cart = await db.cart.findUnique({ where: { id } });
  if (!cart)
    return ok(res, {
      items: [],
      subtotal: 0,
      promotionDiscount: 0,
      couponDiscount: 0,
      total: 0,
      couponCode: null,
    });
  const input = cartSchema.parse({
    items: cart.items,
    couponCode: cart.couponCode,
    email: req.query.email,
  });
  try {
    ok(res, await calculate(input));
  } catch (e) {
    if (e instanceof HttpError)
      return ok(res, {
        items: cart.items,
        couponCode: cart.couponCode,
        invalid: true,
        message: e.message,
      });
    throw e;
  }
});
publicApi.put("/cart", async (req, res) => {
  const input = cartSchema.parse(req.body);
  const totals = await calculate(input);
  const id = cartId(req, res);
  await db.cart.upsert({
    where: { id },
    create: { id, items: input.items, couponCode: input.couponCode },
    update: { items: input.items, couponCode: input.couponCode },
  });
  ok(res, totals);
});
publicApi.post("/orders", limited, async (req, res) => {
  const customer = customerSchema.parse(req.body);
  const key = z.string().uuid().parse(req.headers["idempotency-key"]);
  if (req.user?.role === "CUSTOMER" && req.user.email !== customer.email)
    throw new HttpError(422, "Utilisez l’email de votre compte.");
  const result = await placeOrder(
    cartId(req, res),
    customer,
    key,
    req.user?.role === "CUSTOMER" ? req.user.id : undefined,
  );
  ok(res, result, 201);
});
publicApi.get("/orders", requireRole("CUSTOMER"), async (req, res) =>
  ok(
    res,
    await db.order.findMany({
      where: { customer: { userId: req.user!.id } },
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ),
);
publicApi.get("/orders/:id", requireRole("CUSTOMER"), async (req, res) => {
  const order = await db.order.findFirst({
    where: { id: String(req.params.id), customer: { userId: req.user!.id } },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new HttpError(404, "Commande introuvable.");
  ok(res, order);
});
publicApi.post("/quotes", limited, async (req, res) => {
  const b = quoteSchema.parse(req.body);
  const { items, ...data } = b;
  const quote = await db.$transaction(async (tx) => {
    const q = await tx.quoteRequest.create({
      data: {
        ...data,
        number: `pending-${randomUUID()}`,
        items: { create: items },
      },
    });
    const result = await tx.quoteRequest.update({
      where: { id: q.id },
      data: {
        number: `DEV-${new Date().getFullYear()}-${String(q.sequence).padStart(5, "0")}`,
      },
      include: { items: true },
    });
    await quoteEmail(tx, result, "QUOTE_CREATED");
    return result;
  });
  ok(res, { id: quote.id, number: quote.number }, 201);
});
publicApi.post("/contact", limited, async (req, res) => {
  const b = z
    .object({
      name: z.string().min(2).max(160),
      email: z.string().email(),
      phone: z.string().max(30).default(""),
      subject: z.string().min(2).max(200),
      message: z.string().min(10).max(10000),
    })
    .parse(req.body);
  const m = await db.$transaction(async (tx) => {
    const m = await tx.contactMessage.create({ data: b });
    await contactEmail(tx, m);
    return m;
  });
  ok(res, { id: m.id, received: true }, 201);
});
