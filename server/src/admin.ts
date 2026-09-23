import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  OrderStatus,
  QuoteStatus,
  MessageStatus,
  Prisma,
} from "@prisma/client";
import { db, transaction } from "./db.js";
import { requireRole } from "./auth.js";
import { ok, HttpError, page } from "./http.js";
import { productInclude, transitions } from "./commerce.js";
import {
  categorySchema,
  productSchema,
  couponSchema,
  promotionSchema,
  serviceSchema,
  settingsSchema,
} from "./validation.js";
import { orderEmail, quoteEmail, smtpConfigured } from "./mail.js";
export const admin = Router();
admin.use(requireRole("ADMIN", "MANAGER"));
const managerSections = new Set([
  "dashboard",
  "products",
  "orders",
  "quotes",
  "customers",
  "promotions",
  "coupons",
  "uploads",
  "options",
]);
admin.use((req, _res, next) => {
  if (
    req.user?.role === "MANAGER" &&
    !managerSections.has(req.path.split("/")[1])
  )
    return next(
      new HttpError(403, "Cette section est réservée aux administrateurs."),
    );
  next();
});
// Lean relation choices are independent of the paginated management tables.
admin.get("/options", async (_req, res) => {
  const [categories, products] = await Promise.all([
    db.category.findMany({
      select: { id: true, name: true, active: true },
      orderBy: { displayOrder: "asc" },
    }),
    db.product.findMany({
      select: { id: true, name: true, active: true },
      orderBy: { name: "asc" },
    }),
  ]);
  ok(res, { categories, products });
});
admin.get("/dashboard", async (_req, res) => {
  const now = new Date();
  const [
    orders,
    customers,
    products,
    categories,
    promotions,
    quotes,
    totals,
    groups,
    recentOrders,
    recentQuotes,
    lowStock,
    lowVariants,
  ] = await Promise.all([
    db.order.count(),
    db.customer.count(),
    db.product.count(),
    db.category.count(),
    db.promotion.count({
      where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    }),
    db.quoteRequest.count(),
    db.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.findMany({ take: 6, orderBy: { createdAt: "desc" } }),
    db.quoteRequest.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    db.product.findMany({
      where: {
        active: true,
        trackStock: true,
        stock: { lte: 10 },
        variants: { none: {} },
      },
      take: 10,
    }),
    db.productVariant.findMany({
      where: {
        active: true,
        stock: { lte: 10 },
        product: { active: true, trackStock: true },
      },
      include: { product: { select: { name: true } } },
      take: 10,
    }),
  ]);
  ok(res, {
    orders,
    customers,
    products,
    categories,
    promotions,
    quotes,
    revenue: totals._sum.total ?? 0,
    statuses: Object.fromEntries(groups.map((g) => [g.status, g._count])),
    recentOrders,
    recentQuotes,
    lowStock,
    lowVariants,
  });
});
admin.get("/orders", async (req, res) => {
  const { page: p, limit, skip } = page(req.query);
  const q = String(req.query.q || "");
  const status = req.query.status
    ? z.nativeEnum(OrderStatus).parse(req.query.status)
    : undefined;
  const filters = z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      min: z.coerce.number().min(0).optional(),
      max: z.coerce.number().min(0).optional(),
    })
    .parse(req.query);
  if (
    filters.to &&
    typeof req.query.to === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)
  )
    filters.to.setUTCHours(23, 59, 59, 999);
  const where: Prisma.OrderWhereInput = {
    status,
    ...(q
      ? {
          OR: ["number", "firstName", "lastName", "phone", "email"].map(
            (k) => ({ [k]: { contains: q, mode: "insensitive" } }),
          ),
        }
      : {}),
    createdAt: { gte: filters.from, lte: filters.to },
    total: { gte: filters.min, lte: filters.max },
  };
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);
  ok(res, rows, 200, {
    page: p,
    limit,
    total,
    pages: Math.ceil(total / limit),
  });
});
admin.get("/orders/:id", async (req, res) => {
  const o = await db.order.findUnique({
    where: { id: String(req.params.id) },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!o) throw new HttpError(404, "Commande introuvable.");
  ok(res, o);
});
admin.patch("/orders/:id/status", async (req, res) => {
  const b = z
    .object({
      status: z.nativeEnum(OrderStatus),
      note: z.string().max(2000).default(""),
    })
    .parse(req.body);
  const order = await transaction(async (tx) => {
    const o = await tx.order.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true },
    });
    if (!o) throw new HttpError(404, "Commande introuvable.");
    if (!transitions[o.status].includes(b.status))
      throw new HttpError(
        409,
        "Cette transition de statut n’est pas autorisée.",
      );
    if (b.status === "CANCELLED") {
      for (const i of o.items) {
        if (!i.productId) continue;
        const movement = await tx.inventoryMovement.findFirst({
          where: {
            productId: i.productId,
            variantId: i.variantId,
            reason: `Commande ${o.id}`,
          },
        });
        if (!movement) continue;
        if (i.variantId)
          await tx.productVariant.update({
            where: { id: i.variantId },
            data: { stock: { increment: i.quantity } },
          });
        else
          await tx.product.update({
            where: { id: i.productId },
            data: { stock: { increment: i.quantity } },
          });
        await tx.inventoryMovement.create({
          data: {
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            reason: `Annulation ${o.id}`,
          },
        });
      }
      if (o.couponId)
        await tx.coupon.update({
          where: { id: o.couponId },
          data: { usageCount: { decrement: 1 } },
        });
    }
    const history = await tx.orderStatusHistory.create({
      data: { orderId: o.id, ...b, actor: req.user!.name },
    });
    const updated = await tx.order.update({
      where: { id: o.id },
      data: { status: b.status },
      include: { items: true, history: { orderBy: { createdAt: "asc" } } },
    });
    await orderEmail(tx, updated, "ORDER_STATUS", history.id);
    return updated;
  });
  ok(res, order);
});
admin.get("/settings", async (_req, res) =>
  ok(
    res,
    (await db.siteSetting.findUnique({ where: { key: "site" } }))?.value ?? {},
  ),
);
admin.put("/settings", requireRole("ADMIN"), async (req, res) => {
  const b = settingsSchema.parse(req.body);
  ok(
    res,
    await db.siteSetting.upsert({
      where: { key: "site" },
      create: { key: "site", value: b },
      update: { value: b },
    }),
  );
});
const configs: Record<
  string,
  { model: string; schema?: z.ZodTypeAny; include?: any; search: string[] }
> = {
  products: {
    model: "product",
    schema: productSchema,
    include: {
      ...productInclude,
      related: { select: { id: true, name: true } },
    },
    search: ["name", "sku"],
  },
  categories: {
    model: "category",
    schema: categorySchema,
    include: { _count: { select: { products: true } } },
    search: ["name"],
  },
  coupons: { model: "coupon", schema: couponSchema, search: ["code"] },
  promotions: {
    model: "promotion",
    schema: promotionSchema,
    include: {
      products: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true } },
    },
    search: ["name"],
  },
  services: { model: "service", schema: serviceSchema, search: ["title"] },
  customers: {
    model: "customer",
    include: { _count: { select: { orders: true } }, addresses: true },
    search: ["firstName", "lastName", "email", "phone"],
  },
  quotes: {
    model: "quoteRequest",
    include: { items: true },
    search: ["number", "name", "email", "phone"],
  },
  messages: { model: "contactMessage", search: ["name", "email", "subject"] },
  users: { model: "user", search: ["name", "email"] },
};
function model(tx: any, name: string) {
  return tx[name];
}
function redact(section: string, rows: any[]) {
  return section === "users"
    ? rows.map(({ passwordHash, tokenVersion, ...r }) => r)
    : rows;
}
async function audit(
  tx: any,
  req: any,
  action: string,
  entity: string,
  entityId: string,
) {
  await tx.auditLog.create({
    data: { userId: req.user.id, action, entity, entityId },
  });
}
async function save(section: string, b: any, id: string | undefined, req: any) {
  const conf = configs[section];
  return transaction(async (tx) => {
    let data = { ...b };
    if (section === "categories" && id && b.parentId) {
      let parent = await tx.category.findUnique({ where: { id: b.parentId } });
      while (parent) {
        if (parent.id === id)
          throw new HttpError(
            422,
            "Une catégorie ne peut pas être son propre parent.",
          );
        parent = parent.parentId
          ? await tx.category.findUnique({ where: { id: parent.parentId } })
          : null;
      }
    }
    if (section === "products") {
      const { images, variants, relatedIds, ...base } = b;
      data = {
        ...base,
        images: {
          ...(id ? { deleteMany: {} } : {}),
          create: images.map((x: any, i: number) => ({
            ...x,
            displayOrder: i,
          })),
        },
        related: {
          set: relatedIds
            .filter((x: string) => x !== id)
            .map((id: string) => ({ id })),
        },
      };
      const record = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({
            data: {
              ...data,
              related: { connect: relatedIds.map((id: string) => ({ id })) },
            },
          });
      const previous = await tx.productVariant.findMany({
        where: { productId: record.id },
      });
      for (const v of variants) {
        const { id: vid, ...value } = v;
        if (vid) {
          if (!previous.some((p) => p.id === vid))
            throw new HttpError(422, "Variante invalide.");
          await tx.productVariant.update({ where: { id: vid }, data: value });
        } else
          await tx.productVariant.create({
            data: { ...value, productId: record.id },
          });
      }
      // Keep variants referenced by historical orders, but disable removed variants.
      for (const v of previous.filter(
        (v) => !variants.some((x: any) => x.id === v.id),
      ))
        await tx.productVariant.update({
          where: { id: v.id },
          data: { active: false },
        });
      await audit(tx, req, id ? "UPDATE" : "CREATE", section, record.id);
      return tx.product.findUnique({
        where: { id: record.id },
        include: conf.include,
      });
    }
    if (section === "promotions") {
      const { productIds, categoryIds, ...rest } = b;
      data = {
        ...rest,
        products: {
          [id ? "set" : "connect"]: productIds.map((id: string) => ({ id })),
        },
        categories: {
          [id ? "set" : "connect"]: categoryIds.map((id: string) => ({ id })),
        },
      };
    }
    const record = id
      ? await model(tx, conf.model).update({ where: { id }, data })
      : await model(tx, conf.model).create({ data });
    await audit(tx, req, id ? "UPDATE" : "CREATE", section, record.id);
    return record;
  });
}
for (const [section, conf] of Object.entries(configs)) {
  admin.get(`/${section}`, async (req, res) => {
    const { page: p, limit, skip } = page(req.query);
    const q = String(req.query.q || "").slice(0, 200);
    const where: any = q
      ? {
          OR: conf.search.map((k) => ({
            [k]: { contains: q, mode: "insensitive" },
          })),
        }
      : {};
    if (req.query.status && section === "quotes")
      where.status = z.nativeEnum(QuoteStatus).parse(req.query.status);
    if (req.query.status && section === "messages")
      where.status = z.nativeEnum(MessageStatus).parse(req.query.status);
    const m = model(db, conf.model);
    const [rows, total] = await Promise.all([
      m.findMany({
        where,
        include: conf.include,
        skip,
        take: limit,
        orderBy:
          section === "categories" || section === "services"
            ? { displayOrder: "asc" }
            : section === "coupons" || section === "promotions"
              ? { id: "desc" }
              : { createdAt: "desc" },
      }),
      m.count({ where }),
    ]);
    ok(res, redact(section, rows), 200, {
      page: p,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  });
  if (conf.schema) {
    admin.post(`/${section}`, async (req, res) =>
      ok(
        res,
        await save(section, conf.schema!.parse(req.body), undefined, req),
        201,
      ),
    );
    admin.put(`/${section}/:id`, async (req, res) =>
      ok(
        res,
        await save(
          section,
          conf.schema!.parse(req.body),
          String(req.params.id),
          req,
        ),
      ),
    );
    admin.delete(`/${section}/:id`, async (req, res) => {
      const id = String(req.params.id);
      await transaction(async (tx) => {
        if (
          section === "products" &&
          (await tx.orderItem.count({ where: { productId: id } }))
        )
          throw new HttpError(
            409,
            "Ce produit appartient à des commandes. Désactivez-le pour conserver son historique.",
          );
        if (
          section === "categories" &&
          (await tx.product.count({ where: { categoryId: id } }))
        )
          throw new HttpError(
            409,
            "Déplacez les produits ou désactivez cette catégorie avant suppression.",
          );
        await model(tx, conf.model).delete({ where: { id } });
        await audit(tx, req, "DELETE", section, id);
      });
      ok(res, { deleted: true });
    });
  }
}
admin.patch("/quotes/:id", async (req, res) => {
  const b = z
    .object({
      status: z.nativeEnum(QuoteStatus),
      adminNotes: z.string().max(10000).default(""),
    })
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    const old = await tx.quoteRequest.findUniqueOrThrow({
      where: { id: String(req.params.id) },
    });
    const q = await tx.quoteRequest.update({
      where: { id: old.id },
      data: b,
      include: { items: true },
    });
    if (old.status !== q.status)
      await quoteEmail(tx, q, "QUOTE_STATUS", `${q.id}-${randomUUID()}`);
    return q;
  });
  ok(res, result);
});
admin.patch("/messages/:id", requireRole("ADMIN"), async (req, res) => {
  const b = z.object({ status: z.nativeEnum(MessageStatus) }).parse(req.body);
  ok(
    res,
    await db.contactMessage.update({
      where: { id: String(req.params.id) },
      data: b,
    }),
  );
});
const userSchema = z.object({
  name: z.string().min(2).max(160),
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase()),
  password: z.string().min(12).max(72).optional(),
  role: z.enum(["ADMIN", "MANAGER"]),
  active: z.boolean().default(true),
});
admin.post("/users", requireRole("ADMIN"), async (req, res) => {
  const { password, ...data } = userSchema.parse(req.body);
  if (!password) throw new HttpError(422, "Mot de passe requis.");
  const u = await db.user.create({
    data: { ...data, passwordHash: await bcrypt.hash(password, 12) },
  });
  ok(res, redact("users", [u])[0], 201);
});
admin.put("/users/:id", requireRole("ADMIN"), async (req, res) => {
  const id = String(req.params.id);
  const { password, ...data } = userSchema.parse(req.body);
  if (id === req.user!.id && (!data.active || data.role !== "ADMIN"))
    throw new HttpError(
      422,
      "Vous ne pouvez pas retirer votre propre accès administrateur.",
    );
  const u = await db.user.update({
    where: { id },
    data: {
      ...data,
      tokenVersion: { increment: 1 },
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
  });
  ok(res, redact("users", [u])[0]);
});

admin.get("/notifications", requireRole("ADMIN"), async (req, res) => {
  const { page: p, limit, skip } = page(req.query);
  const q = String(req.query.q || "").slice(0, 200);
  const status = req.query.status
    ? z
        .enum(["PENDING", "SENDING", "RETRY", "SENT", "FAILED"])
        .parse(req.query.status)
    : undefined;
  const where: Prisma.EmailNotificationWhereInput = {
    status,
    ...(q
      ? {
          OR: [
            { to: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.emailNotification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        to: true,
        subject: true,
        event: true,
        reference: true,
        status: true,
        attempts: true,
        lastError: true,
        sentAt: true,
        createdAt: true,
      },
    }),
    db.emailNotification.count({ where }),
  ]);
  ok(res, rows, 200, {
    page: p,
    limit,
    total,
    pages: Math.ceil(total / limit),
    smtpConfigured: smtpConfigured(),
  });
});
admin.get("/notifications/:id", requireRole("ADMIN"), async (req, res) =>
  ok(
    res,
    await db.emailNotification.findUniqueOrThrow({
      where: { id: String(req.params.id) },
    }),
  ),
);
admin.post(
  "/notifications/:id/retry",
  requireRole("ADMIN"),
  async (req, res) => {
    const mail = await db.emailNotification.findUniqueOrThrow({
      where: { id: String(req.params.id) },
    });
    if (mail.status === "SENDING")
      throw new HttpError(409, "Envoi déjà en cours.");
    ok(
      res,
      await db.emailNotification.update({
        where: { id: mail.id },
        data: {
          status: "PENDING",
          attempts: 0,
          nextAttemptAt: new Date(),
          lastError: null,
        },
      }),
    );
  },
);
