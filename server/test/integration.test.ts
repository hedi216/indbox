import "dotenv/config";
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const base = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const prefix = "qa-" + Date.now();
class Session {
  cookies = new Map<string, string>();
  async request(
    path: string,
    method = "GET",
    body?: any,
    headers: Record<string, string> = {},
  ) {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    for (const c of r.headers.getSetCookie()) {
      const pair = c.split(";")[0];
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const b = await r.json();
    return { status: r.status, ...b };
  }
}
before(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await fetch(base + "/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Start the API before integration tests");
});
const admin = new Session(),
  guest = new Session();
let category: any,
  product: any,
  coupon: any,
  promotion: any,
  order: any,
  quote: any;
const email = prefix + "@example.com";
const customer = {
  firstName: "Test",
  lastName: "Client",
  email,
  phone: "+216 22000000",
  address: "12 Rue des Tests",
  city: "Tunis",
  notes: "<script>alert(1)</script>",
};
after(async () => {
  const orders = await db.order.findMany({
    where: { email: { contains: prefix } },
  });
  await db.emailNotification.deleteMany({
    where: {
      OR: [
        { to: { contains: prefix } },
        { reference: { in: orders.map((o) => o.id) } },
      ],
    },
  });
  await db.order.deleteMany({ where: { email: { contains: prefix } } });
  await db.quoteRequest.deleteMany({ where: { email: { contains: prefix } } });
  await db.contactMessage.deleteMany({
    where: { email: { contains: prefix } },
  });
  await db.customer.deleteMany({ where: { email: { contains: prefix } } });
  await db.user.deleteMany({ where: { email: { contains: prefix } } });
  await db.promotion.deleteMany({ where: { name: { startsWith: prefix } } });
  await db.coupon.deleteMany({
    where: { code: { startsWith: prefix.toUpperCase() } },
  });
  await db.product.deleteMany({ where: { slug: { startsWith: prefix } } });
  await db.category.deleteMany({ where: { slug: { startsWith: prefix } } });
  await db.auditLog.deleteMany({
    where: {
      entityId: {
        in: [category?.id, product?.id, coupon?.id, promotion?.id].filter(
          Boolean,
        ),
      },
    },
  });
  await db.$disconnect();
});
test("Full PostgreSQL commerce lifecycle, authorization and transactional stock", async (t) => {
  await t.test("health, seed and admin authentication", async () => {
    assert.equal((await guest.request("/health")).data.database, "postgresql");
    assert.ok((await guest.request("/categories")).data.length >= 7);
    assert.ok((await guest.request("/products?limit=100")).data.length >= 12);
    assert.equal((await guest.request("/admin/dashboard")).status, 401);
    const r = await admin.request("/auth/login", "POST", {
      email: process.env.SEED_ADMIN_EMAIL || "admin@indbox.local",
      password: process.env.SEED_ADMIN_PASSWORD || "Indbox-Dev-2026!",
    });
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.data.role, "ADMIN");
  });
  await t.test(
    "admin creates category, product and variants visible publicly",
    async () => {
      const c = await admin.request("/admin/categories", "POST", {
        name: prefix + " catégorie",
        slug: prefix + "-category",
        description: "Catégorie QA",
        active: true,
        featured: true,
      });
      assert.equal(c.status, 201, JSON.stringify(c));
      category = c.data;
      const p = await admin.request("/admin/products", "POST", {
        name: prefix + " produit",
        slug: prefix + "-product",
        sku: prefix,
        categoryId: category.id,
        price: 45,
        stock: 5,
        orderUnit: "LOT",
        quantityPerLot: 50,
        tags: ["verification"],
        images: [{ url: "/assets/catalog/coffret.webp", alt: "Coffret" }],
        specifications: { Matière: "Kraft" },
        variants: [
          {
            name: "Petit format",
            sku: prefix + "-S",
            price: 45,
            stock: 5,
            quantityPerLot: 50,
            dimensions: "10 × 15 cm",
          },
          {
            name: "Grand format",
            sku: prefix + "-L",
            price: 60,
            stock: 10,
            quantityPerLot: 50,
          },
        ],
      });
      assert.equal(p.status, 201, JSON.stringify(p));
      product = p.data;
      const pub = await guest.request("/products/" + product.slug);
      assert.equal(pub.data.variants.length, 2);
      assert.equal(pub.data.currentPrice, 45);
      assert.equal(
        (await guest.request("/products?q=verification")).data.some(
          (p: any) => p.id === product.id,
        ),
        true,
      );
      assert.equal(
        (await admin.request("/admin/categories/" + category.id, "DELETE"))
          .status,
        409,
      );
    },
  );
  await t.test(
    "product edits propagate and promotions calculate server-side",
    async () => {
      const edit = await admin.request("/admin/products/" + product.id, "PUT", {
        ...product,
        shortDescription: "Modifié depuis administration",
        relatedIds: [],
      });
      assert.equal(edit.status, 200, JSON.stringify(edit));
      assert.equal(
        (await guest.request("/products/" + product.slug)).data
          .shortDescription,
        "Modifié depuis administration",
      );
      const promo = await admin.request("/admin/promotions", "POST", {
        name: prefix + " promotion",
        type: "FIXED",
        value: 10,
        startsAt: new Date(Date.now() - 60000),
        endsAt: new Date(Date.now() + 86400000),
        categoryIds: [category.id],
      });
      assert.equal(promo.status, 201, JSON.stringify(promo));
      promotion = promo.data;
      const pub = await guest.request("/products/" + product.slug);
      assert.equal(pub.data.currentPrice, 35);
      assert.equal(pub.data.variants[1].currentPrice, 50);
      const c = await admin.request("/admin/coupons", "POST", {
        code: prefix,
        type: "PERCENTAGE",
        value: 10,
        startsAt: new Date(Date.now() - 60000),
        endsAt: new Date(Date.now() + 86400000),
        minimumOrder: 50,
        usageLimit: 2,
        perCustomerLimit: 1,
      });
      assert.equal(c.status, 201, JSON.stringify(c));
      coupon = c.data;
    },
  );
  await t.test(
    "cart ignores submitted prices; validates variant, minimum and coupons",
    async () => {
      await guest.request("/cart");
      const variant = product.variants.find((v: any) => Number(v.price) === 45);
      let r = await guest.request("/cart", "PUT", {
        items: [
          {
            productId: product.id,
            variantId: variant.id,
            quantity: 2,
            price: 0,
          },
        ],
        couponCode: prefix,
        email,
      });
      assert.equal(r.status, 200, JSON.stringify(r));
      assert.equal(r.data.subtotal, 90);
      assert.equal(r.data.promotionDiscount, 20);
      assert.equal(r.data.couponDiscount, 7);
      assert.equal(r.data.total, 63);
      r = await guest.request("/cart", "PUT", {
        items: [{ productId: product.id, quantity: 1 }],
      });
      assert.equal(r.status, 422);
      r = await guest.request("/cart", "PUT", {
        items: [{ productId: product.id, variantId: variant.id, quantity: 6 }],
      });
      assert.equal(r.status, 409);
      r = await guest.request("/cart", "PUT", {
        items: [{ productId: product.id, variantId: variant.id, quantity: 1 }],
        couponCode: prefix,
        email,
      });
      assert.equal(r.status, 422);
    },
  );
  await t.test(
    "checkout atomically persists order, stock, coupon, email and idempotency",
    async () => {
      const key = randomUUID();
      let r = await guest.request(
        "/orders",
        "POST",
        { ...customer, total: 0 },
        { "Idempotency-Key": key },
      );
      assert.equal(r.status, 201, JSON.stringify(r));
      order = r.data;
      assert.match(order.number, /^INDB-\d{4}-\d{6}$/);
      assert.equal(Number(order.total), 63);
      assert.equal(order.items[0].quantityPerLot, 50);
      assert.equal(order.items[0].variantName, "Petit format");
      const v = await db.productVariant.findUniqueOrThrow({
        where: { id: order.items[0].variantId },
      });
      assert.equal(v.stock, 3);
      assert.equal(
        (await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } }))
          .usageCount,
        1,
      );
      const mail = await db.emailNotification.findFirstOrThrow({
        where: { event: "ORDER_CREATED", reference: order.id, to: email },
      });
      assert.equal(mail.status, "PENDING");
      assert.ok(mail.html.includes(order.number));
      assert.ok(mail.html.includes("&lt;script&gt;"));
      assert.ok(!mail.html.includes("<script>"));
      r = await guest.request("/orders", "POST", customer, {
        "Idempotency-Key": key,
      });
      assert.equal(r.data.id, order.id);
      assert.equal(
        (await db.productVariant.findUniqueOrThrow({ where: { id: v.id } }))
          .stock,
        3,
      );
      assert.equal((await guest.request("/cart")).data.items.length, 0);
      const list = await admin.request("/admin/orders?q=" + order.number);
      assert.equal(list.data[0].id, order.id);
    },
  );
  await t.test(
    "status transitions create timeline and notification; cancellation restocks once",
    async () => {
      let r = await admin.request(
        "/admin/orders/" + order.id + "/status",
        "PATCH",
        { status: "CONFIRMED", note: "Validation QA" },
      );
      assert.equal(r.status, 200, JSON.stringify(r));
      assert.equal(r.data.history.length, 2);
      assert.equal(
        await db.emailNotification.count({
          where: { event: "ORDER_STATUS", to: email },
        }),
        1,
      );
      r = await admin.request(
        "/admin/orders/" + order.id + "/status",
        "PATCH",
        { status: "DELIVERED" },
      );
      assert.equal(r.status, 409);
      r = await admin.request(
        "/admin/orders/" + order.id + "/status",
        "PATCH",
        { status: "CANCELLED" },
      );
      assert.equal(r.status, 200);
      assert.equal(
        (
          await db.productVariant.findUniqueOrThrow({
            where: { id: order.items[0].variantId },
          })
        ).stock,
        5,
      );
      assert.equal(
        (await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } }))
          .usageCount,
        0,
      );
      assert.equal(
        (
          await admin.request(
            "/admin/orders/" + order.id + "/status",
            "PATCH",
            { status: "CANCELLED" },
          )
        ).status,
        409,
      );
    },
  );
  await t.test(
    "expiry and disabled coupon/promotion are enforced",
    async () => {
      const variant = product.variants.find((v: any) => Number(v.price) === 45);
      await db.coupon.update({
        where: { id: coupon.id },
        data: { active: false },
      });
      assert.equal(
        (
          await guest.request("/cart", "PUT", {
            items: [
              { productId: product.id, variantId: variant.id, quantity: 2 },
            ],
            couponCode: prefix,
            email,
          })
        ).status,
        422,
      );
      await db.coupon.update({
        where: { id: coupon.id },
        data: { active: true, endsAt: new Date(Date.now() - 1000) },
      });
      assert.equal(
        (
          await guest.request("/cart", "PUT", {
            items: [
              { productId: product.id, variantId: variant.id, quantity: 2 },
            ],
            couponCode: prefix,
            email,
          })
        ).status,
        422,
      );
      await db.promotion.update({
        where: { id: promotion.id },
        data: { endsAt: new Date(Date.now() - 1000) },
      });
      assert.equal(
        (await guest.request("/products/" + product.slug)).data.currentPrice,
        45,
      );
    },
  );
  await t.test("concurrent final-unit purchases cannot oversell", async () => {
    const v = product.variants.find((v: any) => Number(v.price) === 45);
    await db.productVariant.update({ where: { id: v.id }, data: { stock: 1 } });
    const a = new Session(),
      b = new Session();
    for (const s of [a, b]) {
      await s.request("/cart");
      assert.equal(
        (
          await s.request("/cart", "PUT", {
            items: [{ productId: product.id, variantId: v.id, quantity: 1 }],
          })
        ).status,
        200,
      );
    }
    const results = await Promise.all([
      a.request(
        "/orders",
        "POST",
        { ...customer, email: prefix + "-race1@example.com" },
        { "Idempotency-Key": randomUUID() },
      ),
      b.request(
        "/orders",
        "POST",
        { ...customer, email: prefix + "-race2@example.com" },
        { "Idempotency-Key": randomUUID() },
      ),
    ]);
    assert.deepEqual(
      results.map((r) => r.status).sort(),
      [201, 409],
      JSON.stringify(results),
    );
    assert.equal(
      (await db.productVariant.findUniqueOrThrow({ where: { id: v.id } }))
        .stock,
      0,
    );
  });
  await t.test(
    "quote and contact records visible to admin and emails queued",
    async () => {
      const r = await guest.request("/quotes", "POST", {
        name: "QA Quote",
        email,
        phone: "+21622000000",
        notes: "Projet de test",
        files: [],
        items: [
          {
            packagingType: "Coffret personnalisé",
            quantity: 500,
            categoryId: category.id,
            dimensions: "20 × 15 cm",
            material: "Kraft",
          },
        ],
      });
      assert.equal(r.status, 201, JSON.stringify(r));
      quote = r.data;
      assert.match(quote.number, /^DEV-\d{4}-\d{5}$/);
      assert.equal(
        (await admin.request("/admin/quotes?q=" + quote.number)).data[0].id,
        quote.id,
      );
      const update = await admin.request("/admin/quotes/" + quote.id, "PATCH", {
        status: "REVIEWING",
        adminNotes: "Interne secret",
      });
      assert.equal(update.status, 200);
      const mail = await db.emailNotification.findFirstOrThrow({
        where: { event: "QUOTE_STATUS", to: email },
      });
      assert.ok(!mail.html.includes("Interne secret"));
      assert.equal(
        (
          await guest.request("/contact", "POST", {
            name: "QA Contact",
            email,
            subject: "Demande test",
            message: "Un message complet de vérification.",
          })
        ).status,
        201,
      );
      assert.equal(
        (await admin.request("/admin/messages?q=" + email)).data.length,
        1,
      );
      assert.ok((await admin.request("/admin/notifications")).meta.total >= 1);
    },
  );
  await t.test(
    "manager authorization, customer isolation and origin checks",
    async () => {
      const r = await admin.request("/admin/users", "POST", {
        name: "QA Manager",
        email: prefix + "-manager@example.com",
        password: "Qa-Password-2026!",
        role: "MANAGER",
      });
      assert.equal(r.status, 201);
      const invitation = await db.emailNotification.findFirstOrThrow({
        where: { to: r.data.email, event: { startsWith: "SECURITY_INVITE_" } },
        orderBy: { createdAt: "desc" },
      });
      const temporaryPassword = invitation.html.match(
        /Mot de passe temporaire : <strong>([^<]+)</,
      )![1];
      const manager = new Session();
      await manager.request("/auth/login", "POST", {
        email: r.data.email,
        password: temporaryPassword,
      });
      assert.equal((await manager.request("/admin/products")).status, 403);
      assert.equal(
        (
          await manager.request("/auth/change-password", "POST", {
            currentPassword: temporaryPassword,
            password: "Qa-Password-2026!",
          })
        ).status,
        200,
      );
      await manager.request("/auth/login", "POST", {
        email: r.data.email,
        password: "Qa-Password-2026!",
      });
      assert.equal((await manager.request("/admin/products")).status, 200);
      assert.equal((await manager.request("/admin/settings")).status, 403);
      assert.equal(
        (
          await manager.request("/admin/categories", "POST", {
            name: "Illegal",
            slug: "illegal",
          })
        ).status,
        403,
      );
      const customerSession = new Session();
      const register = await customerSession.request("/auth/register", "POST", {
        firstName: "Client",
        lastName: "Compte",
        phone: "+21620000000",
        email: prefix + "-account@example.com",
        password: "Qa-Customer-2026!",
        role: "ADMIN",
      });
      assert.equal(register.status, 201, JSON.stringify(register));
      assert.equal(register.data.role, "CUSTOMER");
      assert.equal(
        (await customerSession.request("/admin/products")).status,
        403,
      );
      assert.equal(
        (await customerSession.request("/orders/" + order.id)).status,
        404,
      );
      assert.equal(
        (
          await guest.request(
            "/contact",
            "POST",
            { name: "Bad" },
            { Origin: "https://evil.example" },
          )
        ).status,
        403,
      );
    },
  );
  await t.test(
    "all queued transactional templates carry the shared signature",
    async () => {
      const messages = await db.emailNotification.findMany({
        where: { to: email },
      });
      for (const event of [
        "ORDER_CREATED",
        "ORDER_STATUS",
        "QUOTE_CREATED",
        "QUOTE_STATUS",
        "CONTACT_RECEIVED",
      ]) {
        assert.ok(
          messages.some((m) => m.event === event),
          event,
        );
      }
      for (const message of messages) {
        assert.ok(
          message.html.includes(
            "Email généré par BizzRes, une solution de Comeleon Studio.",
          ),
        );
        assert.ok(
          message.text.endsWith(
            "Email généré par BizzRes, une solution de Comeleon Studio.\nhttps://www.comeleonstudio.com",
          ),
        );
        if (message.event.startsWith("ORDER"))
          assert.ok(
            message.text.includes(
              new URL(
                "/account",
                process.env.PUBLIC_URL || "http://localhost:5175",
              ).href,
            ),
          );
      }
      const retry = await admin.request(
        "/admin/notifications/" + messages[0].id + "/retry",
        "POST",
        {},
      );
      assert.equal(retry.status, 409, "unset cutoff must block manual release");
    },
  );
  await t.test(
    "safe delete preserves ordered products and category tree integrity",
    async () => {
      assert.equal(
        (await admin.request("/admin/products/" + product.id, "DELETE")).status,
        409,
      );
      assert.equal(
        (
          await admin.request("/admin/categories/" + category.id, "PUT", {
            ...category,
            parentId: category.id,
          })
        ).status,
        422,
      );
      const c = await admin.request("/admin/categories", "POST", {
        name: "Temporary",
        slug: prefix + "-delete",
      });
      assert.equal(
        (await admin.request("/admin/categories/" + c.data.id, "DELETE"))
          .status,
        200,
      );
    },
  );
});
